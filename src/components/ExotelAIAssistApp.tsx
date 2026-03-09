import React, { useEffect, useRef } from "react";
import { Theme, Tabs, Flex, Box, Heading, Badge, Text, IconButton, Tooltip } from "@radix-ui/themes";
import { Lightbulb, FileText, Copy, Info, Smile, Meh, Frown } from "lucide-react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import { useExotelAIAssist } from "../hooks/useExotelAIAssist";
import { ExotelAIAssistParams, Suggestion, TranscriptLine, Sentiment, BotConfig } from "../types";
import LoadingBox from "./LoadingBox";
import { EmptyState } from "./EmptyState";
import "../styles/index.css";
import { Sparkle } from "./logos/Sparkle";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ sentiment, botConfig }: { sentiment: Sentiment | null; botConfig: BotConfig | null }): JSX.Element {
  const isDeactivated = botConfig?.status === "DRAFT" || botConfig?.status === "DEACTIVATED";

  const getSentimentIcon = () => {
    if (!sentiment) return null;
    if (sentiment.label === "positive") return <Smile size={18} />;
    if (sentiment.label === "neutral") return <Meh size={18} />;
    return <Frown size={18} />;
  };

  const getSentimentColor = (): "amber" | "gray" | "red" => {
    if (sentiment?.label === "positive") return "amber";
    if (sentiment?.label === "negative") return "red";
    return "gray";
  };

  return (
    <Flex align="center" justify="between" py="4">
      <Flex align="center" gap="2">
        <Sparkle />
        <Heading as="h1" className="oa-header-title" style={{ fontSize: "18px" }}>
          AI Assist
        </Heading>
      </Flex>

      {sentiment && botConfig?.sentiment === true ? (
        <Badge color={getSentimentColor()} variant="soft" style={{ fontSize: "15px", padding: "5px", borderRadius: "10px" }}>
          <Flex align="center" gap="1">
            {getSentimentIcon()}
            <span style={{ textTransform: "capitalize" }}>{sentiment.label}</span>
          </Flex>
        </Badge>
      ) : isDeactivated ? (
        <Tooltip content="Assistant is deactivated. Contact your administrator to activate it.">
          <span style={{ display: "inline-flex", alignItems: "center", cursor: "help" }} aria-label="Assistant deactivated">
            <Info size={18} />
          </span>
        </Tooltip>
      ) : null}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Suggestions tab
// ---------------------------------------------------------------------------

function SuggestionsTab({ suggestions, connected, botConfig }: { suggestions: Suggestion[]; connected: boolean; botConfig: BotConfig | null }): JSX.Element {
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
    <Flex
      direction="column"
      gap="4"
      style={{
        flex: 1,
        overflow: "auto",
        minHeight: 0,
        marginTop: "10px",
        marginBottom: "10px",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      {displayed.map((suggestion, index) => {
        const isRecent = index === 0;
        const cardClass = isRecent ? "oa-suggestion-card oa-suggestion-card--recent" : "oa-suggestion-card oa-suggestion-card--older";

        return (
          <Flex key={suggestion.id} direction="row" align="start" gap="2" style={{ alignItems: "flex-start" }}>
            {isRecent ? (
              <Box className="oa-suggestion-card--recent-wrapper" style={{ flex: "1 1 auto", maxWidth: "80%" }}>
                <Box className={cardClass}>
                  <Text className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                    {suggestion.text}
                  </Text>
                </Box>
              </Box>
            ) : (
              <Box className={cardClass} style={{ flex: "1 1 auto", maxWidth: "80%" }}>
                <Text className="oa-suggestion-text" style={{ fontSize: "15px" }}>
                  {suggestion.text}
                </Text>
              </Box>
            )}
            <IconButton className="oa-copy-icon" variant="soft" color="gray" aria-label="Copy suggestion" onClick={() => handleCopy(suggestion.text)} style={{ flexShrink: 0, marginTop: "10px" }}>
              <Copy size={14} />
            </IconButton>
          </Flex>
        );
      })}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Transcript tab
// ---------------------------------------------------------------------------

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TranscriptTab({ transcripts, connected, botConfig }: { transcripts: TranscriptLine[]; connected: boolean; botConfig: BotConfig | null }): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcripts]);

  if (!connected) {
    return <EmptyState title="Assistant is inactive" subtitle="Start a call to receive real-time transcript." />;
  }

  if (botConfig?.transcript === false) {
    return <EmptyState title="Transcript is disabled" subtitle="Transcript is disabled in the bot configuration. Please contact the administrator to enable it." />;
  }

  if (botConfig?.status === "DRAFT" || botConfig?.status === "DEACTIVATED") {
    return <EmptyState title="Assistant is not published" subtitle="Assistant is not published. Please contact the administrator to publish it." />;
  }

  if (transcripts.length === 0) {
    return <LoadingBox message="Looking for transcript" />;
  }

  return (
    <div ref={scrollRef} style={{ flex: 1, overflow: "auto", minHeight: 0, marginTop: "10px", marginBottom: "10px" }}>
      <Flex direction="column" gap="3">
        {transcripts.map((line) => (
          <Flex key={line.id} gap="3" align="start" direction="row" style={{ padding: "10px", borderBottom: "1px solid var(--gray-3)" }}>
            <span
              style={{
                flexShrink: 0,
                padding: "3px",
                borderRadius: "4px",
                backgroundColor: "var(--gray-3)",
                color: "black",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {formatTimestamp(line.startTime)}
            </span>
            <Text size="2" style={{ flex: 1, color: "var(--gray-12)", fontSize: "15px" }}>
              {line.text}
            </Text>
          </Flex>
        ))}
      </Flex>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface ExotelAIAssistProps extends ExotelAIAssistParams {
  className?: string;
}

export function ExotelAIAssist({ className, ...params }: ExotelAIAssistProps): JSX.Element {
  const { status, suggestions, transcripts, sentiment, botConfig } = useExotelAIAssist(params as ExotelAIAssistParams);

  const connected = status === "connected";

  return (
    <Theme className="oa-theme-root">
      <Box className={`oa-panel${className ? ` ${className}` : ""}`}>
        <Flex direction="column" style={{ flex: 1, width: "100%", minHeight: 0, padding: "0 16px" }}>
          <Header sentiment={sentiment} botConfig={botConfig} />

          <Tabs.Root defaultValue="suggestions" className="oa-tabs" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Tabs.List>
              <Tabs.Trigger value="suggestions" style={{ fontSize: "15px" }}>
                <Lightbulb size={16} />
                Suggestions
              </Tabs.Trigger>
              <Tabs.Trigger value="transcript" aria-label="Transcript" style={{ fontSize: "15px" }}>
                <FileText size={16} />
                Transcript
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="suggestions" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingTop: 16 }}>
              <SuggestionsTab suggestions={suggestions} connected={connected} botConfig={botConfig} />
            </Tabs.Content>

            <Tabs.Content value="transcript" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingTop: 16 }}>
              <TranscriptTab transcripts={transcripts} connected={connected} botConfig={botConfig} />
            </Tabs.Content>
          </Tabs.Root>
        </Flex>
      </Box>

      <Toaster position="bottom-center" />
    </Theme>
  );
}

export { ExotelAIAssist as ExotelAIAssistApp };
