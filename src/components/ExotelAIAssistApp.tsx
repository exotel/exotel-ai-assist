import React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Lightbulb, FileText } from "lucide-react";
import { ToastProvider } from "./Toast";

import { useExotelAIAssist } from "../hooks/useExotelAIAssist";
import { ExotelAIAssistParams } from "../types";
import "../styles/index.css";
import { Header } from "./key-components/Header";
import { SuggestionsTab } from "./key-components/SuggestionTab";
import { TranscriptTab } from "./key-components/TranscriptTab";

export interface ExotelAIAssistProps extends ExotelAIAssistParams {
  className?: string;
}

export function ExotelAIAssist({ className, ...params }: ExotelAIAssistProps): JSX.Element {
  const { status, suggestions, transcripts, sentiment, botConfig } = useExotelAIAssist(params as ExotelAIAssistParams);

  const connected = status === "connected";

  return (
    <Tooltip.Provider>
      <div className="oa-theme-root">
        <ToastProvider>
          <div className={`oa-panel${className ? ` ${className}` : ""}`}>
            <div style={{ flex: 1, width: "100%", minHeight: 0, padding: "0 16px", display: "flex", flexDirection: "column" }}>
              <Header sentiment={sentiment} botConfig={botConfig} />

              <Tabs.Root defaultValue="suggestions" className="oa-tabs" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Tabs.List className="oa-tabs-list">
                  <Tabs.Trigger value="suggestions" className="oa-tabs-trigger">
                    <Lightbulb size={16} />
                    Suggestions
                  </Tabs.Trigger>
                  <Tabs.Trigger value="transcript" className="oa-tabs-trigger" aria-label="Transcript">
                    <FileText size={16} />
                    Transcript
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="suggestions" className="oa-tabs-content" style={{ paddingTop: 16 }}>
                  <SuggestionsTab suggestions={suggestions} connected={connected} botConfig={botConfig} />
                </Tabs.Content>

                <Tabs.Content value="transcript" className="oa-tabs-content" style={{ paddingTop: 16 }}>
                  <TranscriptTab transcripts={transcripts} connected={connected} botConfig={botConfig} />
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </div>
        </ToastProvider>
      </div>
    </Tooltip.Provider>
  );
}

export { ExotelAIAssist as ExotelAIAssistApp };
