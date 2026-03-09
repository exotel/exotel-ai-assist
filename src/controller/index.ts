import EventEmitter from "eventemitter3";
import { ExotelAIAssistParams, ConnectionStatus, ControllerEvents, Suggestion, TranscriptLine, SentimentScore, WssEvent, InitialHandshakeResponse, WssResponse } from "../types";
import { ITransport, createTransport } from "../transport";

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sentimentScore(label: string): number {
  const l = label.toLowerCase();
  if (l === "positive") return 0.8;
  if (l === "negative") return -0.8;
  return 0.0;
}

/** Production AI Assist WebSocket endpoint — used when wssBaseUrl is not supplied. */
// const DEFAULT_WSS_BASE_URL = "wss://ai-assist.in.exotel.com/ai-assist/one-assistant-event-publisher";

function getWssBaseUrl(accountId: string): string {
  return `wss://ai-assist.in.exotel.com/ai-assist/accounts/${accountId}/one-assistant-event-publisher`;
}

function buildWsUrl(params: ExotelAIAssistParams): string {
  const { authToken, callSid, accountId, source, wssBaseUrl, reconnectInterval, maxReconnectAttempts, debug, ...extra } = params;
  const resolved = wssBaseUrl ?? getWssBaseUrl(accountId);
  const base = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
  const query = new URLSearchParams({
    authToken,
    conversation_id:callSid,
    source,
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
  });
  return `${base}?${query.toString()}`;
}

export class ExotelAIAssistController extends EventEmitter<ControllerEvents> {
  private params: ExotelAIAssistParams;
  private transport: ITransport | null = null;
  private status: ConnectionStatus = "idle";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private readonly reconnectInterval: number;
  private readonly maxReconnectAttempts: number;
  private readonly debug: boolean;

  constructor(params: ExotelAIAssistParams) {
    super();
    this.params = { ...params };
    this.reconnectInterval = params.reconnectInterval ?? 3000;
    this.maxReconnectAttempts = params.maxReconnectAttempts ?? 5;
    this.debug = params.debug ?? false;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  connect(): void {
    if (this.destroyed) return;
    this._clearReconnectTimer();
    this._setStatus("connecting");
    this._ensureTransport();
    this.transport!.connect(buildWsUrl(this.params));
  }

  disconnect(): void {
    this._clearReconnectTimer();
    this.transport?.disconnect();
    this._setStatus("disconnected");
  }

  /**
   * Merges a partial params patch.
   * - `callSid` change → close and reconnect with new callSid.
   * - Any other change → send `params_update` over the open socket.
   */
  setParams(patch: Partial<ExotelAIAssistParams>): void {
    const prev = this.params;
    this.params = { ...prev, ...patch };

    if (patch.callSid !== undefined && patch.callSid !== prev.callSid) {
      this._log("callSid changed — reconnecting");
      this.reconnectAttempt = 0;
      this._clearReconnectTimer();
      this.transport?.disconnect();
      if (this.params.callSid) {
        // Only reconnect if the new callSid is non-empty
        this._setStatus("connecting");
        this._ensureTransport();
        this.transport!.connect(buildWsUrl(this.params));
      } else {
        this._setStatus("idle");
      }
    } else if (this.status === "connected") {
      const updateMsg = JSON.stringify({ type: "params_update", payload: patch });
      this.transport?.send(updateMsg);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this._clearReconnectTimer();
    this.transport?.destroy();
    this.transport = null;
    this.removeAllListeners();
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // --------------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------------

  private _ensureTransport(): void {
    if (this.transport) return;
    this.transport = createTransport();
    this.transport.onMessage((msg) => this._handleTransportMessage(msg));
  }

  private _handleTransportMessage(msg: { type: string; payload?: string; message?: string }): void {
    switch (msg.type) {
      case "CONNECTED":
        this.reconnectAttempt = 0;
        this._setStatus("connected");
        this.emit("onCallStart", { callSid: this.params.callSid });
        break;

      case "DISCONNECTED":
        this._setStatus("disconnected");
        this.emit("onCallEnd", { callSid: this.params.callSid });
        this._scheduleReconnect();
        break;

      case "ERROR":
        this._setStatus("error");
        this.emit("error", new Error(msg.message ?? "Unknown transport error"));
        break;

      case "MESSAGE":
        if (msg.payload) this._handleServerPayload(msg.payload);
        break;
    }
  }

  /**
   * Parses the AI Assist backend WSS message and maps it to consumer types.
   *
   * Two shapes arrive from the backend (both are internal details):
   *   1. Initial handshake: { type, config, events: WssEvent[] | WssEvent }
   *   2. Ongoing events:   { config, events: WssEvent }
   *
   * Internally we map these to the public Suggestion / TranscriptLine /
   * SentimentScore types before emitting — consumers never see the raw shape.
   */
  private _handleServerPayload(raw: string): void {
    let parsed: InitialHandshakeResponse | WssResponse;
    try {
      parsed = JSON.parse(raw) as InitialHandshakeResponse | WssResponse;
    } catch {
      this.emit("error", new Error(`Failed to parse server message: ${raw}`));
      return;
    }

    this.emit("raw", parsed);

    if (parsed.config) {
      this.emit("botConfig", parsed.config);
    }

    const eventsRaw = parsed.events;
    if (!eventsRaw) return;

    const events: WssEvent[] = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
    const now = Date.now();

    for (const event of events) {
      if (!event) continue;

      // --- Transcript lines --------------------------------------------------
      if (event.transcript && event.transcript.length > 0) {
        const lines: TranscriptLine[] = event.transcript.map((msg) => {
          const first = msg.transcript_segments?.[0];
          const last = msg.transcript_segments?.[msg.transcript_segments.length - 1];
          return {
            id: String(msg.sequence),
            speaker: "customer",
            text: msg.transcript_segments.map((s) => s.text).join(" "),
            startTime: first?.start_timestamp ? Date.parse(first.start_timestamp) : now,
            endTime: last?.end_timestamp ? Date.parse(last.end_timestamp) : now,
            isFinal: msg.transcript_segments.every((s) => s.is_final),
          };
        });
        this.emit("transcript", lines);
      }

      // --- Suggestion --------------------------------------------------------
      if (event.event_type === "suggestion" && event.text) {
        const suggestion: Suggestion = {
          id: genId(),
          text: event.text,
          confidence: 1.0,
          timestamp: now,
        };
        this.emit("suggestion", suggestion);
      }

      // --- Sentiment ---------------------------------------------------------
      if (event.event_type === "sentiment" && event.text) {
        const label = event.text.toLowerCase() as SentimentScore["label"];
        const sentiment: SentimentScore = {
          label,
          score: sentimentScore(label),
          timestamp: now,
        };
        this.emit("sentiment", sentiment);
      }
    }
  }

  private _scheduleReconnect(): void {
    if (this.destroyed) return;
    if (this.status === "error") return;

    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      const err = new Error("MAX_RECONNECT_EXCEEDED");
      (err as Error & { code: string }).code = "MAX_RECONNECT_EXCEEDED";
      this.emit("error", err);
      return;
    }

    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempt), 30_000);
    this._log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.reconnectAttempt += 1;
      this._setStatus("connecting");
      this.transport?.connect(buildWsUrl(this.params));
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit("statusChange", status);
  }

  private _log(...args: unknown[]): void {
    if (this.debug) {
      console.log("[ExotelAIAssist]", ...args);
    }
  }
}
