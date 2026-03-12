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
    return `wss://ai-assist.in.exotel.com/ai-assist/accounts/${accountId}/one-assistant-event-publisher`;
  }

  /**
   * Builds a WebSocket URL from the given parameters.
   * @param params - The parameters to build the WebSocket URL from.
   * @returns The WebSocket URL.
   */
  static buildWsUrl(params: ExotelAIAssistParams): string {
    // Just for testing purposes
    const { defaultParams, extraParams } = Utils.getDefaultAndExtraParams(params);
    const resolved = defaultParams.wssBaseUrl ?? Utils.getWssBaseUrl(params.accountId);
    const base = resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
    const extraEntries = Object.entries(extraParams).slice(0, Utils.MAX_EXTRA_QUERY_PARAMS);
    const query = new URLSearchParams({
      ...defaultParams,
      ...Object.fromEntries(extraEntries.map(([k, v]) => [k, String(v)])),
    });
    return `${base}?${query.toString()}`;
  }

  static getDefaultAndExtraParams(params: ExotelAIAssistParams): { defaultParams: Record<string, string>; extraParams: Record<string, string> } {
    const copiedParams = { ...params };
    const { accountId, authToken, wssBaseUrl, reconnectInterval, maxReconnectAttempts } = copiedParams;

    // Filter out undefined values and coerce numbers to strings so the result
    // satisfies Record<string, string>.
    const defaultParams: Record<string, string> = Object.fromEntries(
      Object.entries({ accountId, authToken, wssBaseUrl, reconnectInterval, maxReconnectAttempts })
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    );

    Object.keys(defaultParams).forEach((key) => {
      delete copiedParams[key];
    });

    const extraParams = Object.fromEntries(Object.entries(copiedParams).map(([k, v]) => [k, String(v)]));
    return { defaultParams, extraParams };
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
