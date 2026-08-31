export interface ExotelAIAssistParams {
  authToken: string;
  call_sid: string;
  /** Exotel account identifier. */
  accountId: string;
  /** WebSocket base URL. Defaults to the Exotel AI Assist backend if omitted. */
  wssBaseUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  [key: string]: unknown;
}

/** A single AI-generated suggestion for the agent. */
export interface Suggestion {
  id: string;
  value: string;
  timestamp: number;
  sequence: number;
  feedbackType: "good" | "bad" | null;
  badFeedbackReason: string | null;
}

/** A single spoken line as received in the live transcript. */
export interface TranscriptLine {
  /** Unique stable ID (derived from the backend sequence number). */
  id: string;
  value: string;
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

/**
 * Server-side stream state, received via `stream_status` messages.
 * - `connected`              – stream is active and healthy
 * - `throttled`              – capacity full; the bot cannot join this call
 * - `quota_exhausted`        – the tenant's plan quota is exhausted
 * - `agent_quota_exhausted`  – the current agent's call quota is exhausted
 * - `pending`                – stream is pending
 */
export type StreamState =
  | "connected"
  | "throttled"
  | "quota_exhausted"
  | "agent_quota_exhausted"
  | "pending"
  | "disconnected"
  | "connection_timeout";

// ---------------------------------------------------------------------------
// Internal-only backend response types
// ---------------------------------------------------------------------------

/** Feature-flag config received from the AI Assist backend. */
export interface BotConfig {
  sentiment: boolean;
  transcript: boolean;
  suggestion: {
    enabled: boolean;
    feedback_enabled: boolean;
    bad_feedback_options?: string[];
  };
  status: "LIVE" | "DRAFT" | "DEACTIVATED";
}

interface TranscriptSegment {
  is_final: boolean;
  end_timestamp: string;
  start_timestamp: string;
  speaker: string;
  text: string;
}

interface TranscriptMessage {
  sequence: number;
  transcript_segments: TranscriptSegment[];
}

export interface SuggestionValue {
  text: string;
  sequence: number;
  feedback_type?: "good" | "bad" | null;
  bad_feedback_reason?: string | null;
}
export interface SuggestionFeedbackMessage {
  type: "suggestion_feedback";
  sequence: number;
  feedback_type: "good" | "bad" | null;
  bad_feedback_reason: string | null;
}

interface WssTranscriptEvent {
  event_type: "transcript";
  value: TranscriptMessage[];
}

interface WssSentimentEvent {
  event_type: "sentiment";
  value: string;
}

interface WssSuggestionEvent {
  event_type: "suggestion";
  value: SuggestionValue;
}

/** Value payload for handover / warm-transfer summary events. */
export interface TransferSummaryValue {
  summary?: string;
  sentiment?: string | number | null;
}

/** Parsed transfer summary shown above the panel tabs. */
export interface TransferSummary {
  summary: string;
  sentiment: string | null;
}

interface WssTransferSummaryEvent {
  event_type: "transfer_summary";
  value: TransferSummaryValue;
}

export type WssEvent = WssTranscriptEvent | WssSentimentEvent | WssSuggestionEvent | WssTransferSummaryEvent;

export interface InitialHandshakeResponse {
  type: string;
  config: BotConfig;
  events: WssEvent[] | WssEvent;
  stream_state?: StreamState;
}

export interface WssResponse {
  config: BotConfig;
  events: WssEvent;
  stream_state?: StreamState;
}

export interface ControllerEvents {
  suggestion: (data: Suggestion) => void;
  transcript: (lines: TranscriptLine[]) => void;
  sentiment: (data: Sentiment) => void;
  /** Warm-transfer / handover summary pushed at stream-setup. */
  transferSummary: (data: TransferSummary) => void;
  /** Internal: bot feature-flag config. Consumed by the UI component only. */
  botConfig: (config: BotConfig) => void;
  /**
   * Fires with `true` once the WebSocket connection is established AND the
   * server has acknowledged it (first successful server message after auth).
   * In multi-tab scenarios where a follower tab joins an already-acknowledged
   * connection, this fires immediately with `true`.
   * Fires with `false` on disconnect.
   */
  onReady: (ready: boolean) => void;
  onCallStart: () => void;
  onCallEnd: () => void;
  statusChange: (status: ConnectionStatus) => void;
  /** Fires whenever the server sends a `stream_status` message. */
  streamState: (state: StreamState) => void;
  /** Fires when another tab updates suggestion feedback, for cross-tab UI sync. */
  suggestionFeedbackSync: (data: { sequence: number; feedbackType: "good" | "bad" | null; badFeedbackReason: string | null }) => void;
  error: (err: Error) => void;
  raw: (data: unknown) => void;
}

export type WorkerInboundMessage =
  | { type: "MESSAGE"; payload: string }
  | { type: "CONNECTED" }
  | { type: "ACKNOWLEDGED" }
  | { type: "DISCONNECTED"; code?: number }
  | { type: "ERROR"; message: string }
  | { type: "FEEDBACK_SYNC"; sequence: number; feedbackType: "good" | "bad" | null; badFeedbackReason: string | null };
