import React, { useEffect, useRef } from "react";
import { Flex, Text } from "@radix-ui/themes";

import { TranscriptLine, BotConfig } from "../../types";
import LoadingBox from "../LoadingBox";
import { EmptyState } from "../EmptyState";
import "../../styles/index.css";
import { Utils } from "../../utils";

export function TranscriptTab({ transcripts, connected, botConfig }: { transcripts: TranscriptLine[]; connected: boolean; botConfig: BotConfig | null }): JSX.Element {
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
              {Utils.formatTimestamp(line.startTime)}
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
