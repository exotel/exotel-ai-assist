import objectHash from "object-hash";
import { ExotelAIAssistParams } from "../types";

export class Utils {
  static MAX_EXTRA_QUERY_PARAMS = 5;
  /**
   * Returns a deterministic SHA-1 hex digest for any plain object.
   *
   * Key ordering is irrelevant — `{a:1, b:2}` and `{b:2, a:1}` produce the
   * same hash.  Powered by `object-hash`, which handles nested objects,
   * arrays, and all primitive types correctly.
   */
  static hash(obj: Record<string, unknown>): string {
    return objectHash(obj, { respectType: false, unorderedObjects: true });
  }

  /**
   * Formats a timestamp in milliseconds to a human-readable time string.
   * @param ms - The timestamp in milliseconds.
   * @returns The formatted time string.
   */
  static formatTimestamp(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /**
   * Returns the base WebSocket URL for the given account ID.
   * @param accountId - The account ID to get the base WebSocket URL for.
   * @returns The base WebSocket URL.
   */
  static getWssBaseUrl(accountId: string): string {
    return `wss://ai-assist.in.exotel.com/ai-assist/accounts/${accountId}/one-assistant-event-publisher`;
  }

  /**
   * Builds a WebSocket URL from the given parameters.
   * @param params - The parameters to build the WebSocket URL from.
   * @returns The WebSocket URL.
   */
  static buildWsUrl(params: ExotelAIAssistParams): string {
    const { authToken: _authToken, callSid, accountId, source, wssBaseUrl, reconnectInterval, maxReconnectAttempts, debug, ...extra } = params;
    const resolved = wssBaseUrl ?? Utils.getWssBaseUrl(accountId);
    const base = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
    const extraEntries = Object.entries(extra).slice(0, Utils.MAX_EXTRA_QUERY_PARAMS);
    const query = new URLSearchParams({
      ...Object.fromEntries(extraEntries.map(([k, v]) => [k, String(v)])),
    });
    return `${base}?${query.toString()}`;
  }

  /**
   * Returns a unique ID string.
   *
   * If the browser supports `crypto.randomUUID`, it uses that. Otherwise, it
   * falls back to a simple timestamp-based ID.
   * @returns A unique ID string.
   */
  static getUniqueId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
