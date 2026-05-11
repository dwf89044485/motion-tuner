import React, { useState } from "react";
import type { MotionTargetDef } from "motion-tuner-core";
import { MotionTunerProvider, useMotionTuner } from "motion-tuner-react";
import { EditorRuntime } from "motion-tuner-ui";

// ══════════════════════════════════════════════════════════════════
// Motion Tuner · Basic Example
// 一张真正会动的卡片 · hover 时浮起 + 阴影扩散 + 微微放大
// 参数面板遵循"感觉旋钮优先"设计哲学（3 primary + 4 advanced）
// ══════════════════════════════════════════════════════════════════

const HOVER_CARD_MOTION: MotionTargetDef = {
  id: "hover-card",
  label: "Hover Card",
  schema: [
    // ── Primary · 设计师日常调的 3 个"感觉旋钮" ────────────────
    { key: "hoverStrength", label: "悬浮强度", min: 0, max: 1.5, step: 0.05, group: "Feel" },
    { key: "animationSpeed", label: "动画速度", min: 0.1, max: 1.2, step: 0.05, group: "Feel" },
    { key: "shadowIntensity", label: "阴影强度", min: 0, max: 2, step: 0.05, group: "Feel" },

    // ── Advanced · 进阶乘数，默认折叠 ─────────────────────────
    { key: "yFactor", label: "Y 位移系数 (px)", min: 0, max: 40, step: 1, group: "Advanced" },
    { key: "scaleFactor", label: "放大系数", min: 0, max: 0.2, step: 0.01, group: "Advanced" },
    { key: "shadowBlur", label: "阴影模糊 (px)", min: 0, max: 80, step: 1, group: "Advanced" },
    { key: "shadowAlpha", label: "阴影不透明度", min: 0, max: 0.6, step: 0.02, group: "Advanced" },
  ],
  defaultConfig: {
    hoverStrength: 0.8,
    animationSpeed: 0.45,
    shadowIntensity: 1.0,
    yFactor: 12,
    scaleFactor: 0.04,
    shadowBlur: 48,
    shadowAlpha: 0.35,
  },
};

// ── 派生物理：从"感觉旋钮" + 乘数算出真实 CSS 值 ───────────────
function derive(c: Record<string, number>, hovered: boolean) {
  const h = hovered ? c.hoverStrength : 0;
  const y = -h * c.yFactor;
  const scale = 1 + h * c.scaleFactor;
  const blur = (h * c.shadowBlur + 8) * c.shadowIntensity;
  const alpha = (h * c.shadowAlpha + 0.1) * c.shadowIntensity;
  const shadowY = h * (c.yFactor * 0.8) + 4;
  return { y, scale, blur, alpha, shadowY };
}

function HoverCard() {
  const { ref, config } = useMotionTuner("hover-card", HOVER_CARD_MOTION);
  const [hovered, setHovered] = useState(false);
  const { y, scale, blur, alpha, shadowY } = derive(config, hovered);

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      data-motion-target-id="hover-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 280,
        padding: 32,
        borderRadius: 16,
        background: "linear-gradient(135deg, #1a1f2e 0%, #2a3040 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: `0 ${shadowY}px ${blur}px rgba(0,0,0,${alpha.toFixed(2)})`,
        transform: `translateY(${y}px) scale(${scale})`,
        transition: `transform ${config.animationSpeed}s cubic-bezier(0.16, 1, 0.3, 1), box-shadow ${config.animationSpeed}s cubic-bezier(0.16, 1, 0.3, 1)`,
        cursor: "pointer",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Hover 我
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
        把鼠标移上来，看卡片浮起。<br/>
        点右下角「动效编辑」，选这张卡，调"悬浮强度"看差别。
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          padding: "4px 12px", borderRadius: 20,
          background: "rgba(118,180,255,0.15)",
          color: "rgba(118,180,255,0.9)",
          fontSize: 12, fontWeight: 500,
          fontFamily: "monospace",
        }}>
          悬浮强度 {config.hoverStrength.toFixed(2)}
        </span>
        <span style={{
          padding: "4px 12px", borderRadius: 20,
          background: "rgba(34,211,238,0.15)",
          color: "rgba(34,211,238,0.9)",
          fontSize: 12, fontWeight: 500,
          fontFamily: "monospace",
        }}>
          速度 {config.animationSpeed.toFixed(2)}s
        </span>
        <span style={{
          padding: "4px 12px", borderRadius: 20,
          background: hovered ? "rgba(120,220,150,0.2)" : "rgba(255,255,255,0.05)",
          color: hovered ? "rgba(120,220,150,0.95)" : "rgba(255,255,255,0.4)",
          fontSize: 12, fontWeight: 500,
          fontFamily: "monospace",
          transition: "all 200ms ease",
        }}>
          {hovered ? "● hovering" : "○ rest"}
        </span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <MotionTunerProvider enabled>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 32,
        padding: "48px 24px",
      }}>
        <h1 style={{
          fontSize: 12, fontWeight: 500,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}>
          motion-tuner · basic example
        </h1>
        <HoverCard />
        <p style={{
          fontSize: 12, color: "rgba(255,255,255,0.3)",
          maxWidth: 400, textAlign: "center", lineHeight: 1.7,
        }}>
          这是一个真实的 hover 浮起动效。<br/>
          面板上 <strong style={{color:"rgba(255,255,255,0.6)"}}>Feel</strong> 组的 3 根滑杆是"感觉旋钮"——<br/>
          设计师调这 3 个就能控制 80% 的效果。<br/>
          <strong style={{color:"rgba(255,255,255,0.6)"}}>Advanced</strong> 组是底层乘数，做微调用。
        </p>
      </div>
      <EditorRuntime theme="dark" />
    </MotionTunerProvider>
  );
}
