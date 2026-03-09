/**
 * Default entry point — React is BUNDLED IN.
 * Safe to use from Vue, Angular, vanilla JS, or plain HTML with no React install.
 */
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ExotelAIAssist } from "./components/ExotelAIAssistApp";
import { ExotelAIAssistParams } from "./types";

// Track React roots and merged params per container
const roots = new WeakMap<HTMLElement, Root>();
const paramsMap = new WeakMap<HTMLElement, ExotelAIAssistParams>();

/**
 * Mount the AI-assist widget into `container`.
 * Calling again on the same container re-renders with the new params.
 */
export function mountExotelAIAssist(container: HTMLElement, params: ExotelAIAssistParams): void {
  paramsMap.set(container, params);

  let root = roots.get(container);
  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }
  root.render(React.createElement(ExotelAIAssist, params));
}

/** Unmount and clean up the widget from `container`. */
export function unmountExotelAIAssist(container: HTMLElement): void {
  roots.get(container)?.unmount();
  roots.delete(container);
  paramsMap.delete(container);
}

/**
 * Merge a partial patch into the existing params and re-render.
 * Only works on a container that was previously mounted.
 */
export function updateExotelAIAssistParams(container: HTMLElement, patch: Partial<ExotelAIAssistParams>): void {
  const existing = paramsMap.get(container);
  if (!existing) return;
  const merged = { ...existing, ...patch };
  paramsMap.set(container, merged);
  roots.get(container)?.render(React.createElement(ExotelAIAssist, merged));
}

// Also expose the controller for headless / framework-agnostic usage
export { ExotelAIAssistController } from "./controller";
export type { ExotelAIAssistParams, Suggestion, TranscriptLine, SentimentScore, ConnectionStatus } from "./types";
