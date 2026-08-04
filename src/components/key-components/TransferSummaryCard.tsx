import React, { useState } from "react";
import { ChevronUp, ChevronDown, Smile, Meh, Frown } from "lucide-react";
import { TransferSummary } from "../../types";

export interface TransferSummaryCardProps {
  data: TransferSummary;
}

/** Renders `**bold**` markdown spans; leaves the rest as plain text (keeps bullets via pre-wrap). */
function renderSummaryWithBold(summary: string): React.ReactNode[] {
  const parts = summary.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function TransferSummaryCard({ data }: TransferSummaryCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const sentiment = data.sentiment ?? "";
  const lower = sentiment.toLowerCase();

  const icon = lower.includes("positive") ? (
    <Smile size={16} />
  ) : lower.includes("neutral") ? (
    <Meh size={16} />
  ) : lower.includes("negative") ? (
    <Frown size={16} />
  ) : null;

  const badgeClass = lower.includes("positive")
    ? "oa-transfer-summary-badge oa-transfer-summary-badge--positive"
    : lower.includes("negative")
      ? "oa-transfer-summary-badge oa-transfer-summary-badge--negative"
      : "oa-transfer-summary-badge oa-transfer-summary-badge--neutral";

  return (
    <div className="oa-transfer-summary-card" style={{ marginBottom: 12 }}>
      <div
        className="oa-transfer-summary-header"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
            Transfer Summary
          </span>
          {sentiment ? (
            <span className={badgeClass}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {icon}
                {sentiment}
              </span>
            </span>
          ) : null}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded ? (
        <div className="oa-transfer-summary-body" style={{ marginTop: 8 }}>
          <p
            className="oa-transfer-summary-text"
            style={{
              color: "#374151",
              whiteSpace: "pre-wrap",
              margin: 0,
              lineHeight: 1.5,
              fontSize: 14,
              textAlign: "left",
            }}
          >
            {renderSummaryWithBold(data.summary)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
