import React, { useState, useCallback, useMemo } from "react";
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";

import { Suggestion, BotConfig } from "../../types";
import LoadingBox from "../LoadingBox";
import { EmptyState } from "../EmptyState";
import { useToast } from "../Toast";
import "../../styles/index.css";

export function SuggestionsTab({
  suggestions,
  connected,
  botConfig,
  sendSuggestionFeedback,
}: {
  suggestions: Suggestion[];
  connected: boolean;
  botConfig: BotConfig | null;
  sendSuggestionFeedback: (sequence: number, feedbackType: "good" | "bad" | null, badFeedbackReason?: string | null) => boolean;
}): JSX.Element {
  const toast = useToast();
  const [expandedSequence, setExpandedSequence] = useState<number | null>(null);

  const feedbackEnabled = botConfig?.suggestion?.feedback_enabled === true;

  const badFeedbackOptions = useMemo(() => botConfig?.suggestion?.bad_feedback_options ?? [], [botConfig?.suggestion?.bad_feedback_options]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleThumbsUp = useCallback(
    (sequence: number, currentFeedback: "good" | "bad" | null) => {
      if (!feedbackEnabled) return;
      const newType = currentFeedback === "good" ? null : "good";
      sendSuggestionFeedback(sequence, newType, null);
      setExpandedSequence(null);
    },
    [sendSuggestionFeedback, feedbackEnabled]
  );

  const handleThumbsDown = useCallback(
    (sequence: number, currentFeedback: "good" | "bad" | null) => {
      if (!feedbackEnabled) return;
      if (currentFeedback === "bad") {
        sendSuggestionFeedback(sequence, null, null);
        setExpandedSequence(null);
        return;
      }
      sendSuggestionFeedback(sequence, "bad", null);
      if (badFeedbackOptions.length > 0) {
        setExpandedSequence(sequence);
      }
    },
    [sendSuggestionFeedback, badFeedbackOptions, feedbackEnabled]
  );

  const handleBadFeedbackReason = useCallback(
    (sequence: number, reason: string) => {
      if (!feedbackEnabled) return;
      sendSuggestionFeedback(sequence, "bad", reason);
      setExpandedSequence(null);
    },
    [sendSuggestionFeedback, feedbackEnabled]
  );

  if (!connected) {
    return <EmptyState title="Assistant is inactive" subtitle="Start a call to receive real-time suggestions." />;
  }

  if (botConfig?.suggestion?.enabled === false) {
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
        const showReasons = suggestion.feedbackType === "bad" || expandedSequence === suggestion.sequence;

        return (
          <div key={suggestion.id}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "8px" }}>
              {isRecent ? (
                <div className="oa-suggestion-card--recent-wrapper" style={{ flex: "1 1 auto", maxWidth: "72%" }}>
                  <div className={cardClass}>
                    <span className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                      {suggestion.text}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={cardClass} style={{ flex: "1 1 auto", maxWidth: "72%" }}>
                  <span className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                    {suggestion.value}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0, marginTop: "10px" }}>
                <button className="oa-copy-icon" aria-label="Copy suggestion" onClick={() => handleCopy(suggestion.text)}>
                  <Copy size={14} />
                </button>
                {feedbackEnabled && (
                  <>
                    <button
                      className={`oa-feedback-icon ${suggestion.feedbackType === "good" ? "oa-feedback-icon--positive" : ""}`}
                      aria-label="Mark as helpful"
                      onClick={() => handleThumbsUp(suggestion.sequence, suggestion.feedbackType)}
                      style={{
                        color: suggestion.feedbackType === "good" ? "#16a34a" : undefined,
                      }}
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      className={`oa-feedback-icon ${suggestion.feedbackType === "bad" ? "oa-feedback-icon--negative" : ""}`}
                      aria-label="Mark as not helpful"
                      onClick={() => handleThumbsDown(suggestion.sequence, suggestion.feedbackType)}
                      style={{
                        color: suggestion.feedbackType === "bad" ? "#dc2626" : undefined,
                      }}
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {showReasons && badFeedbackOptions.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {badFeedbackOptions.map((reason) => (
                  <button
                    key={reason}
                    className={`oa-feedback-reason-btn ${suggestion.badFeedbackReason === reason ? "oa-feedback-reason-btn--selected" : ""}`}
                    onClick={() => handleBadFeedbackReason(suggestion.sequence, reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
