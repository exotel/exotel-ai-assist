export interface ExotelAIAssistParams {
  authToken: string;
  callSid: string;
  /** Exotel account identifier. */
  accountId: string;
  /** Source identifier (e.g. agent ID, integration name). */
  source: string;
  /** WebSocket base URL. Defaults to the Exotel AI Assist backend if omitted. */
  wssBaseUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
  [key: string]: unknown;
}

/** A single AI-generated suggestion for the agent. */
export interface Suggestion {
  id: string;
  text: string;
  timestamp: number;
}

/** A single spoken line as received in the live transcript. */
export interface TranscriptLine {
  /** Unique stable ID (derived from the backend sequence number). */
  id: string;
  text: string;
  /** Unix timestamp (ms) of the start of this utterance. */
  startTime: number;
  /** Unix timestamp (ms) of the end of this utterance. */
  endTime: number;
  isFinal: boolean;
}

/** The latest sentiment label for the call. */
export interface Sentiment {
  label: "positive" | "neutral" | "negative";
  timestamp: number;
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

// ---------------------------------------------------------------------------
// Internal-only backend response types
// ---------------------------------------------------------------------------

/** Feature-flag config received from the AI Assist backend. */
export interface BotConfig {
  sentiment: boolean;
  transcript: boolean;
  suggestions: boolean;
  status: "LIVE" | "DRAFT" | "DEACTIVATED";
}

interface TranscriptSegment {
  is_final: boolean;
  end_timestamp: string;
  start_timestamp: string;
  text: string;
}

interface TranscriptMessage {
  sequence: number;
  transcript_segments: TranscriptSegment[];
}

export interface WssEvent {
  event_type: "suggestion" | "sentiment";
  transcript: TranscriptMessage[];
  text: string;
}

export interface InitialHandshakeResponse {
  type: string;
  config: BotConfig;
  events: WssEvent[] | WssEvent;
}

export interface WssResponse {
  config: BotConfig;
  events: WssEvent;
}

export interface ControllerEvents {
  suggestion: (data: Suggestion) => void;
  transcript: (lines: TranscriptLine[]) => void;
  sentiment: (data: Sentiment) => void;
  /** Internal: bot feature-flag config. Consumed by the UI component only. */
  botConfig: (config: BotConfig) => void;
  onCallStart: (data: { callSid: string }) => void;
  onCallEnd: (data: { callSid: string }) => void;
  statusChange: (status: ConnectionStatus) => void;
  error: (err: Error) => void;
  raw: (data: unknown) => void;
}

export type WorkerInboundMessage = { type: "MESSAGE"; payload: string } | { type: "CONNECTED" } | { type: "DISCONNECTED" } | { type: "ERROR"; message: string };
