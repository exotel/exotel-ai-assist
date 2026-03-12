import React, { useEffect, useState } from "react";

interface LoadingBoxProps {
  message?: string;
  skeletonCount?: number;
  className?: string;
}

/**
 * Reusable loading component with animated gradient border (snake effect).
 * All styles are inline for portability — no external CSS classes required.
 */
const LoadingBox: React.FC<LoadingBoxProps> = ({ message = "Looking for suggestions", skeletonCount = 3, className = "" }) => {
  const [gradientAngle, setGradientAngle] = useState(0);
  const [skeletonOpacities, setSkeletonOpacities] = useState<number[]>(Array.from({ length: skeletonCount }, () => 0.5));

  // Animate gradient rotation (snake effect — moves clockwise)
  useEffect(() => {
    const SPEED_DEG_PER_SEC = 90;
    const FRAME_MS = 33; // ~30fps
    let rafId: number | null = null;
    let startTs: number | null = null;
    let lastUpdateTs: number | null = null;
    const startAngle = 0;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      if (lastUpdateTs === null) lastUpdateTs = ts;

      if (ts - lastUpdateTs < FRAME_MS) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }
      lastUpdateTs = ts;

      const elapsedMs = ts - startTs;
      const angle = (startAngle + (elapsedMs * SPEED_DEG_PER_SEC) / 1000) % 360;
      setGradientAngle(angle);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Animate skeleton pulse with staggered effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSkeletonOpacities((prev) =>
        prev.map((_, index) => {
          const delay = index * 0.2;
          const time = Date.now() / 1000;
          const cycle = Math.sin((time + delay) * Math.PI * 2) * 0.5 + 0.5;
          return 0.4 + cycle * 0.6;
        }),
      );
    }, 50);
    return () => clearInterval(interval);
  }, [skeletonCount]);

  const conicGradient = `conic-gradient(
    from ${gradientAngle}deg,
    #3b82f6 0deg,
    #8b5cf6 30deg,
    #ec4899 60deg,
    #f59e0b 90deg,
    transparent 90deg,
    transparent 360deg
  )`;

  const skeletonWidths = ["80%", "65%", "45%"];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: "8px",
        padding: "2px",
        background: "#e5e7eb",
        minHeight: "200px",
      }}
    >
      {/* Rotating snake gradient overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: "8px",
          background: conicGradient,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Inner white content */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          padding: "20px",
          height: "100%",
          minHeight: "196px",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
          <span style={{ color: "#6b7280", fontSize: "14px", lineHeight: "20px" }}>{message}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div
                key={index}
                style={{
                  height: "8px",
                  width: skeletonWidths[index] || "80%",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "4px",
                  opacity: skeletonOpacities[index] || 0.5,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingBox;
