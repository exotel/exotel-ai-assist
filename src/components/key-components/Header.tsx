import { Flex, Heading, Badge, Tooltip } from "@radix-ui/themes";
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
