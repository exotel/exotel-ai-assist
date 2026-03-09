/**
 * React subpath entry point — React is NOT bundled here.
 * For consumers already running a React app (avoids loading two copies of React).
 *
 * Import via: import { ExotelAIAssist } from '@exotel-npm-dev/exotel-ai-assist/react';
 */
export { ExotelAIAssist, ExotelAIAssistApp } from "../components/ExotelAIAssistApp";
export { ExotelAIAssistProvider, useExotelAIAssistContext } from "../components/ExotelAIAssistProvider";
export { useExotelAIAssist } from "../hooks/useExotelAIAssist";
export { ExotelAIAssistController } from "../controller";

export type { ExotelAIAssistParams, Suggestion, TranscriptLine, SentimentScore, ConnectionStatus } from "../types";
export type { UseExotelAIAssistReturn } from "../hooks/useExotelAIAssist";
export type { ExotelAIAssistProps } from "../components/ExotelAIAssistApp";
export type { ExotelAIAssistProviderProps } from "../components/ExotelAIAssistProvider";
