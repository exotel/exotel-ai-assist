import EventEmitter from "eventemitter3";
import { ExotelAIAssistParams, ConnectionStatus, ControllerEvents, Suggestion, TranscriptLine, Sentiment, WssEvent, InitialHandshakeResponse, WssResponse, WorkerInboundMessage } from "../types";
import { ITransport, createTransport } from "../transport";
import { Utils } from "../utils";

export class ExotelAIAssistController extends EventEmitter<ControllerEvents> {
  private params: ExotelAIAssistParams;
  private transport: ITransport | null = null;
  private status: ConnectionStatus = "idle";
  private destroyed = false;

  // True once the WebSocket's onopen fires (CONNECTED received).
  // Reset to false before every new connection attempt.
  // This is the gate for the retry decision:
  //   connectionEstablished === false  → connection never opened → retry
  //   connectionEstablished === true   → server ended a live connection → destroy
  private connectionEstablished = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly RECONNECT_BASE_MS = 3_000;

  constructor(params: ExotelAIAssistParams) {
    super();
    this.params = { ...params };
  }

  connect(): void {
    if (this.destroyed) return;
    this._clearReconnectTimer();
    this.connectionEstablished = false;
    this.reconnectAttempt = 0;
    this._setStatus("connecting");
    this._ensureTransport();
    this.transport!.connect(Utils.buildWsUrl(this.params), this.params.authToken);
  }

  disconnect(): void {
    this._clearReconnectTimer();
    this.transport?.disconnect();
    this._setStatus("disconnected");
  }

  setParams(patch: Partial<ExotelAIAssistParams>): void {
    const prev = this.params;
    this.params = { ...prev, ...patch };
    const hashChanged = Utils.hash(this.params) !== Utils.hash(prev);

    if (hashChanged) {
      this._clearReconnectTimer();
      this.connectionEstablished = false;
      this.reconnectAttempt = 0;
      // Tear down the current transport and start fresh with the new params.
      this.transport?.destroy();
      this.transport = null;
      this._setStatus("connecting");
      this._ensureTransport();
      this.transport!.connect(Utils.buildWsUrl(this.params), this.params.authToken);
    } else if (this.status === "connected") {
      this.transport?.send(JSON.stringify({ type: "params_update", payload: patch }));
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this._clearReconnectTimer();
    this.transport?.destroy();
    this.transport = null;
    this.removeAllListeners();
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private _ensureTransport(): void {
    if (this.transport) return;
    this.transport = createTransport(Utils.hash(this.params));
    this.transport.onMessage((msg) => this._handleTransportMessage(msg));
  }

  private _handleTransportMessage(msg: WorkerInboundMessage): void {
    switch (msg.type) {
      case "CONNECTED":
        this.connectionEstablished = true;
        this.reconnectAttempt = 0;
        this._setStatus("connected");
        this.emit("onCallStart");
        break;

      case "DISCONNECTED":
        if (this.connectionEstablished) {
          // Server ended an already-established connection (call ended, stream
          // not found, auth failure, etc.) — do not retry.
          this._setStatus("disconnected");
          this.emit("onCallEnd");
          this.destroy();
        } else {
          // WebSocket never opened — network/DNS/refused error.
          // Retry up to MAX_RECONNECT_ATTEMPTS then give up.
          this._scheduleReconnect();
        }
        break;

      case "ERROR":
        // onerror fires before onclose; DISCONNECTED will arrive right after
        // and drive the retry / destroy decision. Just surface the error here.
        this.emit("error", new Error(msg.message ?? "Unknown transport error"));
        break;

      case "MESSAGE":
        if (msg.payload) this._handleServerPayload(msg.payload);
        break;
    }
  }

  private _scheduleReconnect(): void {
    if (this.destroyed) return;

    if (this.reconnectAttempt >= ExotelAIAssistController.MAX_RECONNECT_ATTEMPTS) {
      const err = new Error("Connection failed after maximum retries") as Error & { code: string };
      err.code = "MAX_RECONNECT_EXCEEDED";
      this._setStatus("error");
      this.emit("error", err);
      this.destroy();
      return;
    }

    const delay = Math.min(ExotelAIAssistController.RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempt), 30_000);
    this.reconnectAttempt += 1;

    this._setStatus("connecting");
    this.reconnectTimer = setTimeout(() => {
      if (this.destroyed) return;
      this.connectionEstablished = false;
      this.transport?.connect(Utils.buildWsUrl(this.params), this.params.authToken);
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _handleServerPayload(raw: string): void {
    let parsed: InitialHandshakeResponse | WssResponse;
    try {
      parsed = JSON.parse(raw) as InitialHandshakeResponse | WssResponse;
    } catch {
      this.emit("error", new Error(`Failed to parse server message: ${raw}`));
      return;
    }

    this.emit("raw", parsed);

    // Auth error messages arrive before the server closes the connection.
    // Treat both as fatal — the server will follow up with a 4001/4002 close.
    const msgType = (parsed as { type?: string }).type;
    if (msgType === "auth_failed" || msgType === "auth_timeout") {
      const detail = (parsed as { error?: string }).error ?? msgType;
      const err = new Error(detail) as Error & { code: string };
      err.code = msgType.toUpperCase();
      this._setStatus("error");
      this.emit("error", err);
      return;
    }

    if (parsed.config) {
      this.emit("botConfig", parsed.config);
    }

    const eventsRaw = parsed.events;
    if (!eventsRaw) return;

    const events: WssEvent[] = Array.isArray(eventsRaw) ? eventsRaw : [eventsRaw];
    const now = Date.now();

    for (const event of events) {
      if (!event) continue;

      if (event.transcript && event.transcript.length > 0) {
        const lines: TranscriptLine[] = event.transcript.map((msg) => {
          const first = msg.transcript_segments?.[0];
          const last = msg.transcript_segments?.[msg.transcript_segments.length - 1];
          return {
            id: String(msg.sequence),
            text: msg.transcript_segments?.[0]?.text ?? "",
            startTime: first?.start_timestamp ? Date.parse(first.start_timestamp) : now,
            endTime: last?.end_timestamp ? Date.parse(last.end_timestamp) : now,
            isFinal: msg.transcript_segments.every((s) => s.is_final),
          };
        });
        this.emit("transcript", lines);
      }

      if (event.event_type === "suggestion" && event.text) {
        const suggestion: Suggestion = {
          id: Utils.getUniqueId(),
          text: event.text,
          timestamp: now,
        };
        this.emit("suggestion", suggestion);
      }

      if (event.event_type === "sentiment" && event.text) {
        const sentiment: Sentiment = {
          label: event.text.toLowerCase() as Sentiment["label"],
          timestamp: now,
        };
        this.emit("sentiment", sentiment);
      }
    }
  }

  private _setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emit("statusChange", status);
  }
}
