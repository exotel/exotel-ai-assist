import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ExotelAIAssist } from "./components/ExotelAIAssistApp";
import { ExotelAIAssistParams } from "./types";

const roots = new WeakMap<HTMLElement, Root>();

export function mountExotelAIAssist(container: HTMLElement, params: ExotelAIAssistParams): void {
  let root = roots.get(container);
  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }
  root.render(React.createElement(ExotelAIAssist, params));
}

export function unmountExotelAIAssist(container: HTMLElement): void {
  roots.get(container)?.unmount();
  roots.delete(container);
}

export { ExotelAIAssistController } from "./controller";
export type { ExotelAIAssistParams, Suggestion, TranscriptLine, Sentiment, ConnectionStatus } from "./types";
