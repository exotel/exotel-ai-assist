import objectHash from "object-hash";
import { ExotelAIAssistParams } from "../types";

export class Utils {
  static MAX_EXTRA_QUERY_PARAMS = 3;
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
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }

  /**
   * Returns the base WebSocket URL for the given account ID.
   * @param accountId - The account ID to get the base WebSocket URL for.
   * @returns The base WebSocket URL.
   */
  static getWssBaseUrl(accountId: string): string {
    // return `wss://ai-assist.in.exotel.com/ai-assist/accounts/${accountId}/one-assistant-event-publisher`;
    // return `wss://oneassist-uat.in.exotel.com/ai-assist/one-assistant-event-publisher/${accountId}`;
    return `wss://oneassist-uat.in.exotel.com/ai-assist/ws/v1/accounts/${accountId}/ai-assistants/conversation-events`;
  }

  /**
   * Builds a WebSocket URL from the given parameters.
   * @param params - The parameters to build the WebSocket URL from.
   * @returns The WebSocket URL.
   */
  static buildWsUrl(params: ExotelAIAssistParams): string {
    const { wssBaseUrl } = params;

    const resolved = wssBaseUrl ?? Utils.getWssBaseUrl(params.accountId);
    const base = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
    const query = Utils.constructQueryParams(params);
    return `${base}?${query}`;
  }

  static constructQueryParams(params: ExotelAIAssistParams): string {
    // Keys consumed by the library — never forwarded to the server.
    const INTERNAL_KEYS = new Set(["authToken", "accountId", "wssBaseUrl", "reconnectInterval", "maxReconnectAttempts"]);

    // Mandatory server params remapped to the names the API expects.
    // accountId is embedded in the URL path — never sent as a query param.
    const mandatory: [string, string][] = [["access_token", String(params.authToken)]];
    if (params.call_sid !== undefined && params.call_sid !== null) {
      mandatory.push(["call_sid", String(params.call_sid)]);
    }

    // Extra caller-supplied params, excluding internals and already-mapped keys.
    const extra: [string, string][] = (Object.entries(params) as [string, unknown][])
      .filter(([k, v]) => !INTERNAL_KEYS.has(k) && k !== "call_sid" && v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]);

    // Build the query string by appending each pair individually.
    // Passing an array-of-arrays to the URLSearchParams constructor is not
    // reliable in all environments — some fall back to treating the outer
    // array as a plain object, turning index 0 into a key and the inner
    // array's toString() (comma-joined) into the value.
    const query = new URLSearchParams();
    [...mandatory, ...extra].forEach(([k, v]) => query.append(k, v));
    return query.toString();
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
