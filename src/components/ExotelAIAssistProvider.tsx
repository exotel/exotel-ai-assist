import React, { createContext, useContext, ReactNode } from "react";
import { useExotelAIAssist, UseExotelAIAssistReturn } from "../hooks/useExotelAIAssist";
import { ExotelAIAssistParams } from "../types";

const ExotelAIAssistContext = createContext<UseExotelAIAssistReturn | null>(null);

export interface ExotelAIAssistProviderProps extends ExotelAIAssistParams {
  children: ReactNode;
}

/**
 * Provides the AI-assist state to any descendant via `useExotelAIAssistContext`.
 * Useful when multiple child components need to consume the same stream.
 */
export function ExotelAIAssistProvider({ children, ...params }: ExotelAIAssistProviderProps): JSX.Element {
  const value = useExotelAIAssist(params as ExotelAIAssistParams);
  return <ExotelAIAssistContext.Provider value={value}>{children}</ExotelAIAssistContext.Provider>;
}

export function useExotelAIAssistContext(): UseExotelAIAssistReturn {
  const ctx = useContext(ExotelAIAssistContext);
  if (!ctx) {
    throw new Error("useExotelAIAssistContext must be used inside <ExotelAIAssistProvider>");
  }
  return ctx;
}
