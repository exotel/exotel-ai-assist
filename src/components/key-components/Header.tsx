import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Info, Smile, Meh, Frown } from "lucide-react";

import { Sparkle } from "../logos/Sparkle";
import { Sentiment, BotConfig } from "../../types";

export function Header({ sentiment, botConfig }: { sentiment: Sentiment | null; botConfig: BotConfig | null }): JSX.Element {
  const isDeactivated = botConfig?.status === "DRAFT" || botConfig?.status === "DEACTIVATED";

  const getSentimentIcon = () => {
    if (!sentiment) return null;
    if (sentiment.label === "positive") return <Smile size={18} />;
    if (sentiment.label === "negative") return <Frown size={18} />;
    return <Meh size={18} />;
  };

  const getSentimentBadgeStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "15px",
      padding: "5px 8px",
      borderRadius: "10px",
      fontWeight: 500,
    };
    if (sentiment?.label === "positive") return { ...base, background: "#fef3c7", color: "#92400e" };
    if (sentiment?.label === "negative") return { ...base, background: "#fee2e2", color: "#991b1b" };
    return { ...base, background: "#f3f4f6", color: "#374151" };
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Sparkle />
        <h1 className="oa-header-title">AI Assist</h1>
      </div>

      {sentiment && botConfig?.sentiment === true ? (
        <span style={getSentimentBadgeStyle()}>
          {getSentimentIcon()}
          <span style={{ textTransform: "capitalize" }}>{sentiment.label}</span>
        </span>
      ) : isDeactivated ? (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span style={{ display: "inline-flex", alignItems: "center", cursor: "help" }} aria-label="Assistant deactivated">
              <Info size={18} />
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content
            side="top"
            sideOffset={5}
            style={{
              backgroundColor: "#1f2937",
              color: "#f9fafb",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "13px",
              maxWidth: "220px",
              lineHeight: "1.4",
            }}
          >
            Assistant is deactivated. Contact your administrator to activate it.
            <Tooltip.Arrow style={{ fill: "#1f2937" }} />
          </Tooltip.Content>
        </Tooltip.Root>
      ) : null}
    </div>
  );
}
