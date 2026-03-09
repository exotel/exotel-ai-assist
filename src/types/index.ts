// ---------------------------------------------------------------------------
// Public / consumer-facing types
// ---------------------------------------------------------------------------

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
  /** 0–1 confidence. Defaults to 1.0 when not provided by the backend. */
  confidence: number;
  category?: string;
  timestamp: number;
}

/** A single spoken line as received in the live transcript. */
export interface TranscriptLine {
  /** Unique stable ID (derived from the backend sequence number). */
  id: string;
  speaker: "agent" | "customer";
  text: string;
  /** Unix timestamp (ms) of the start of this utterance. */
  startTime: number;
  /** Unix timestamp (ms) of the end of this utterance. */
  endTime: number;
  isFinal: boolean;
}

/** The latest sentiment reading for the call. */
export interface SentimentScore {
  label: "positive" | "neutral" | "negative";
  /** Normalised score: positive ≈ 0.8, neutral ≈ 0.0, negative ≈ –0.8 */
  score: number;
  timestamp: number;
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

// ---------------------------------------------------------------------------
// Internal-only backend response types
// These are never re-exported from the package entry points.
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
  speaker: "user";
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

// ---------------------------------------------------------------------------
// Controller event map — uses consumer types as payloads
// ---------------------------------------------------------------------------

export interface ControllerEvents {
  suggestion: (data: Suggestion) => void;
  transcript: (lines: TranscriptLine[]) => void;
  sentiment: (data: SentimentScore) => void;
  /** Internal: bot feature-flag config. Consumed by the UI component only. */
  botConfig: (config: BotConfig) => void;
  onCallStart: (data: { callSid: string }) => void;
  onCallEnd: (data: { callSid: string }) => void;
  statusChange: (status: ConnectionStatus) => void;
  error: (err: Error) => void;
  raw: (data: unknown) => void;
}

// ---------------------------------------------------------------------------
// Transport internal message envelope
// ---------------------------------------------------------------------------

export type WorkerInboundMessage = { type: "MESSAGE"; payload: string } | { type: "CONNECTED" } | { type: "DISCONNECTED" } | { type: "ERROR"; message: string };
