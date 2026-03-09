import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { NoInteraction } from "./logos/NoInteraction";

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle }) => {
  return (
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
      <Flex direction="column" align="center" gap="2" style={{ textAlign: "center" }}>
        <Text size="4" weight="bold" style={{ color: "#111827", fontSize: "16px", lineHeight: "20px" }}>
          {title}
        </Text>
        <Text size="2" style={{ color: "#6b7280", fontSize: "14px", lineHeight: "20px" }}>
          {subtitle}
        </Text>
      </Flex>
    </div>
  );
};
