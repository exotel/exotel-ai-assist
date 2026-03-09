import React from "react";
import { Flex, Box, Text, IconButton } from "@radix-ui/themes";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

import { Suggestion, BotConfig } from "../../types";
import LoadingBox from "../LoadingBox";
import { EmptyState } from "../EmptyState";
import "../../styles/index.css";

export function SuggestionsTab({ suggestions, connected, botConfig }: { suggestions: Suggestion[]; connected: boolean; botConfig: BotConfig | null }): JSX.Element {
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
