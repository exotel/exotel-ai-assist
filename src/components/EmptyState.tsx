import React from "react";
import { NoInteraction } from "./logos/NoInteraction";
import { WarningBanner } from "./key-components/WarningBanner";

interface EmptyStateProps {
  title: string;
  subtitle: string;
  showWarningBanner?: boolean;
  warningBannerMessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, showWarningBanner = false, warningBannerMessage = "" }) => {
  return (
    <>
      {showWarningBanner && <WarningBanner message={warningBannerMessage} />}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
          gap: "16px",
          height: "100%",
        }}
      >
        <NoInteraction />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
          <span style={{ color: "#111827", fontSize: "16px", lineHeight: "20px", fontWeight: 700 }}>{title}</span>
          <span style={{ color: "#6b7280", fontSize: "14px", lineHeight: "20px" }}>{subtitle}</span>
        </div>
      </div>
    </>
  );
};
