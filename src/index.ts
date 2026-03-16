import React from "react";
import ReactDOM from "react-dom";
import { ExotelAIAssist } from "./components/ExotelAIAssistApp";
import { ExotelAIAssistParams } from "./types";

export function mountExotelAIAssist(container: HTMLElement, params: ExotelAIAssistParams): void {
  ReactDOM.render(React.createElement(ExotelAIAssist, params), container);
}

export function unmountExotelAIAssist(container: HTMLElement): void {
  ReactDOM.unmountComponentAtNode(container);
}

export { ExotelAIAssistController } from "./controller";
export type { ExotelAIAssistParams, Suggestion, TranscriptLine, Sentiment, ConnectionStatus } from "./types";
