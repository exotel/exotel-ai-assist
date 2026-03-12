import React from "react";
import { Copy } from "lucide-react";

import { Suggestion, BotConfig } from "../../types";
import LoadingBox from "../LoadingBox";
import { EmptyState } from "../EmptyState";
import { useToast } from "../Toast";
import "../../styles/index.css";

export function SuggestionsTab({ suggestions, connected, botConfig }: { suggestions: Suggestion[]; connected: boolean; botConfig: BotConfig | null }): JSX.Element {
  const toast = useToast();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!connected) {
    return <EmptyState title="Assistant is inactive" subtitle="Start a call to receive real-time suggestions." />;
  }

  if (botConfig?.suggestions === false) {
    return <EmptyState title="Suggestions are disabled" subtitle="Suggestions are disabled in the bot configuration. Please contact the administrator to enable it." />;
  }

  if (botConfig?.status === "DRAFT" || botConfig?.status === "DEACTIVATED") {
    return <EmptyState title="Assistant is not published" subtitle="Assistant is not published. Please contact the administrator to publish it." />;
  }

  if (suggestions.length === 0) {
    return <LoadingBox message="Looking for suggestions" />;
  }

  const displayed = [...suggestions].reverse();

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        minHeight: 0,
        marginTop: "10px",
        marginBottom: "10px",
        paddingLeft: "10px",
        paddingRight: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {displayed.map((suggestion, index) => {
        const isRecent = index === 0;
        const cardClass = isRecent ? "oa-suggestion-card oa-suggestion-card--recent" : "oa-suggestion-card oa-suggestion-card--older";

        return (
          <div key={suggestion.id} style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "8px" }}>
            {isRecent ? (
              <div className="oa-suggestion-card--recent-wrapper" style={{ flex: "1 1 auto", maxWidth: "80%" }}>
                <div className={cardClass}>
                  <span className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                    {suggestion.text}
                  </span>
                </div>
              </div>
            ) : (
              <div className={cardClass} style={{ flex: "1 1 auto", maxWidth: "80%" }}>
                <span className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                  {suggestion.text}
                </span>
              </div>
            )}
            <button className="oa-copy-icon" aria-label="Copy suggestion" onClick={() => handleCopy(suggestion.text)} style={{ flexShrink: 0, marginTop: "10px" }}>
              <Copy size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
