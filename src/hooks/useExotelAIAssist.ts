import { useEffect, useRef, useState, useCallback } from "react";
import { ExotelAIAssistController } from "../controller";
import { ExotelAIAssistParams, Suggestion, TranscriptLine, Sentiment, BotConfig, ConnectionStatus } from "../types";
import { Utils } from "../utils";

const MAX_SUGGESTIONS = 50;

export interface UseExotelAIAssistReturn {
  status: ConnectionStatus;
  /**
   * `true` once the WebSocket connection is established and the server has
   * acknowledged it.  In multi-tab scenarios where this tab joins an
   * already-acknowledged session, it becomes `true` immediately.
   * Resets to `false` on disconnect.
   */
  isReady: boolean;
  /** AI suggestions, oldest first, capped at 50. */
  suggestions: Suggestion[];
  /** Live transcript lines, ordered by start time. */
  transcripts: TranscriptLine[];
  /** Latest sentiment reading, or null before the first event. */
  sentiment: Sentiment | null;
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

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isReady, setIsReady] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  const paramHash = Utils.hash(params)

  useEffect(() => {
    setStatus("idle");
    setIsReady(false);
    setSuggestions([]);
    setTranscripts([]);
    setSentiment(null);
    setBotConfig(null);
    setLastError(null);

    const ctrl = new ExotelAIAssistController(params);
    controllerRef.current = ctrl;

    ctrl.on("statusChange", setStatus);
    ctrl.on("onReady", setIsReady);
    ctrl.on("botConfig", setBotConfig);
    ctrl.on("suggestion", (s) => setSuggestions((prev) => [...prev, s].slice(-MAX_SUGGESTIONS)));
    ctrl.on("sentiment", setSentiment);
    ctrl.on("transcript", (lines) =>
      setTranscripts((prev) => {
        const map = new Map(prev.map((l) => [l.id, l]));
        for (const l of lines) map.set(l.id, l);
        return Array.from(map.values()).sort((a, b) => a.startTime - b.startTime);
      }),
    );
    ctrl.on("error", setLastError);

    ctrl.connect();

    return () => {
      ctrl.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramHash]);

  const connect = useCallback(() => controllerRef.current?.connect(), []);
  const disconnect = useCallback(() => controllerRef.current?.disconnect(), []);
  const setParams = useCallback((patch: Partial<ExotelAIAssistParams>) => controllerRef.current?.setParams(patch), []);

  return { status, isReady, suggestions, transcripts, sentiment, botConfig, lastError, connect, disconnect, setParams };
}
