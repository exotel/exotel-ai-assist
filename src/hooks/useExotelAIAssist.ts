import { useEffect, useRef, useState, useCallback } from "react";
import { ExotelAIAssistController } from "../controller";
import { ExotelAIAssistParams, Suggestion, TranscriptLine, SentimentScore, BotConfig, ConnectionStatus } from "../types";

export interface UseExotelAIAssistReturn {
  status: ConnectionStatus;
  /** AI suggestions, oldest first. */
  suggestions: Suggestion[];
  /** Live transcript lines, ordered by start time. */
  transcripts: TranscriptLine[];
  /** Latest sentiment reading, or null before the first event. */
  sentiment: SentimentScore | null;
  lastError: Error | null;
  connect: () => void;
  disconnect: () => void;
  setParams: (patch: Partial<ExotelAIAssistParams>) => void;
}

/** Internal extended return — adds botConfig for the UI component only. */
export interface UseExotelAIAssistInternalReturn extends UseExotelAIAssistReturn {
  botConfig: BotConfig | null;
}

export function useExotelAIAssist(params: ExotelAIAssistParams): UseExotelAIAssistInternalReturn {
  const controllerRef = useRef<ExotelAIAssistController | null>(null);
  const paramsRef = useRef<ExotelAIAssistParams>(params);

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [sentiment, setSentiment] = useState<SentimentScore | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    paramsRef.current = params;
  });

  useEffect(() => {
    const ctrl = new ExotelAIAssistController(paramsRef.current);
    controllerRef.current = ctrl;

    ctrl.on("statusChange", setStatus);
    ctrl.on("botConfig", setBotConfig);
    ctrl.on("suggestion", (s) => setSuggestions((prev) => [...prev, s]));
    ctrl.on("transcript", (lines) =>
      setTranscripts((prev) => {
        // Upsert by id (sequence) — interim non-final lines get overwritten
        const map = new Map(prev.map((l) => [l.id, l]));
        for (const l of lines) map.set(l.id, l);
        return Array.from(map.values()).sort((a, b) => a.startTime - b.startTime);
      }),
    );
    ctrl.on("sentiment", setSentiment);
    ctrl.on("error", setLastError);

    // Only connect immediately if callSid is already available.
    // If it is empty on mount (e.g. loaded asynchronously), the params
    // effect below will trigger connect() once callSid becomes non-empty.
    if (paramsRef.current.callSid) {
      ctrl.connect();
    }

    return () => {
      ctrl.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevCallSidRef = useRef(params.callSid);
  useEffect(() => {
    if (!controllerRef.current) return;
    const prevCallSid = prevCallSidRef.current;
    const callSidChanged = params.callSid !== prevCallSid;

    if (callSidChanged) {
      prevCallSidRef.current = params.callSid;
      setSuggestions([]);
      setTranscripts([]);
      setSentiment(null);
      setBotConfig(null);
      setLastError(null);
    }

    if (!params.callSid) {
      // No callSid yet — stay idle, do not attempt a connection
      return;
    }

    // Always delegate to setParams — it updates this.params before connecting,
    // so buildWsUrl always uses the latest callSid.
    // setParams handles all three cases internally:
    //   • callSid went from "" → value  → ensure transport + connect with correct URL
    //   • callSid changed value          → disconnect old, connect new
    //   • only other params changed      → send params_update if already connected
    controllerRef.current.setParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.authToken, params.callSid, params.wssBaseUrl]);

  const connect = useCallback(() => controllerRef.current?.connect(), []);
  const disconnect = useCallback(() => controllerRef.current?.disconnect(), []);
  const setParams = useCallback((patch: Partial<ExotelAIAssistParams>) => controllerRef.current?.setParams(patch), []);

  return { status, suggestions, transcripts, sentiment, botConfig, lastError, connect, disconnect, setParams };
}
