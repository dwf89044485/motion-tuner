import React, { useRef } from "react";
import type { MotionTargetDef } from "motion-tuner-core";
import { MotionTunerProvider, useMotionTuner } from "motion-tuner-react";
import { EditorRuntime } from "motion-tuner-ui";

// ── Define a motion-tunable card ────────────────────────────────

const CARD_MOTION: MotionTargetDef = {
  id: "demo-card",
  label: "Demo Card",
  schema: [
    { key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "Timing" },
    { key: "delay", label: "Delay", min: 0, max: 1, step: 0.01, group: "Timing" },
    { key: "scale", label: "Scale", min: 0.5, max: 1.5, step: 0.01, group: "Transform" },
    { key: "rotate", label: "Rotate", min: -45, max: 45, step: 1, group: "Transform" },
    { key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, group: "Visual" },
  ],
  defaultConfig: {
    duration: 0.3,
    delay: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
};

function DemoCard() {
  const { ref, config } = useMotionTuner("demo-card", CARD_MOTION);

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-motion-target-id="demo-card"
      style={{
        width: 280,
        padding: 32,
        borderRadius: 16,
        background: "linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transform: `scale(${config.scale}) rotate(${config.rotate}deg)`,
        opacity: config.opacity,
        transition: `transform ${config.duration}s ease ${config.delay}s, opacity ${config.duration}s ease ${config.delay}s`,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Motion Tuner
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
        Click the "Motion Tuner" button at the bottom-right, select this card,
        then adjust parameters in the panel.
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <span style={{
          padding: "4px 12px",
          borderRadius: 20,
          background: "rgba(118,180,255,0.15)",
          color: "rgba(118,180,255,0.9)",
          fontSize: 12,
          fontWeight: 500,
        }}>
          duration: {config.duration}s
        </span>
        <span style={{
          padding: "4px 12px",
          borderRadius: 20,
          background: "rgba(34,211,238,0.15)",
          color: "rgba(34,211,238,0.9)",
          fontSize: 12,
          fontWeight: 500,
        }}>
          scale: {config.scale}
        </span>
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────

export function App() {
  return (
    <MotionTunerProvider enabled>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <h1 style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Motion Tuner SDK — Basic Example
        </h1>
        <DemoCard />
      </div>
      <EditorRuntime theme="dark" />
    </MotionTunerProvider>
  );
}
