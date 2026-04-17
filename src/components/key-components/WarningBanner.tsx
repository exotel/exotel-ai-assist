import React from "react";
import { Info } from "lucide-react";

interface WarningBannerProps {
  message?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  message = "AI Assist couldn't join this call — capacity is full. It should be ready for your next call.",
}) => {
  return (
    <div className="oa-throttle-banner">
      <span className="oa-throttle-banner-icon">
        <Info size={16} />
      </span>
      <span className="oa-throttle-banner-text">{message}</span>
    </div>
  );
};