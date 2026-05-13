// ── Vibeset UI — XY Pad ────────────────────────────────────
// 2D drag control using native pointer events (pointer capture).
// No framer-motion.

import React from "react";
import type { ThemeTokens } from "./theme.js";
import { MONO_FONT } from "./theme.js";

export interface XYPadProps {
  xKey: string;
  yKey: string;
  label: string;
  xValue: number;
  yValue: number;
  defaultX: number;
  defaultY: number;
  min: number;
  max: number;
  step: number;
  tokens: ThemeTokens;
  isDark: boolean;
  onChange: (key: string, value: number) => void;
  onCommit?: (key: string, value: number) => void;
  onReset?: (xKey: string, yKey: string) => void;
}

export function XYPad({
  xKey,
  yKey,
  label,
  xValue,
  yValue,
  defaultX,
  defaultY,
  min,
  max,
  step,
  tokens,
  isDark,
  onChange,
  onCommit,
  onReset,
}: XYPadProps) {
  const decimals = step < 1 ? 2 : 0;
  const isDefault = xValue === defaultX && yValue === defaultY;

  const clamp = (raw: number) => {
    const clamped = Math.min(max, Math.max(min, raw));
    return parseFloat(clamped.toFixed(decimals));
  };

  const toPercent = (v: number) => ((v - min) / (max - min)) * 100;
  const xPct = toPercent(xValue);
  const yPct = toPercent(yValue);

  const updateFromPointer = (
    clientX: number,
    clientY: number,
    el: HTMLDivElement,
  ) => {
    const rect = el.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const nextX = clamp(min + xRatio * (max - min));
    const nextY = clamp(min + yRatio * (max - min));
    onChange(xKey, nextX);
    onChange(yKey, nextY);
    return { x: nextX, y: nextY };
  };

  return (
    <div className="mt-xy-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <label
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: tokens.textSecondary,
            display: "flex",
            alignItems: "baseline",
            gap: 4,
          }}
        >
          {label}
          <span
            style={{
              fontSize: 9,
              fontWeight: 400,
              color: tokens.textMuted,
              fontFamily: MONO_FONT,
            }}
          >
            {xKey}/{yKey}
          </span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: tokens.textPrimary,
              fontFamily: MONO_FONT,
              minWidth: 62,
              textAlign: "right",
            }}
          >
            {xValue.toFixed(decimals)}, {yValue.toFixed(decimals)}
          </span>
          {!isDefault && onReset && (
            <button
              onClick={() => onReset(xKey, yKey)}
              title="Reset to default"
              className="mt-reset-btn"
              style={{
                width: 18,
                height: 18,
                border: "none",
                background: tokens.buttonBg,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tokens.buttonText,
                transition: "all 100ms",
                padding: 0,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = tokens.buttonTextHover;
                e.currentTarget.style.background = tokens.buttonBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = tokens.buttonText;
                e.currentTarget.style.background = tokens.buttonBg;
              }}
            >
              <svg
                width={11}
                height={11}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const el = e.currentTarget;
          let latest = updateFromPointer(e.clientX, e.clientY, el);

          el.setPointerCapture(e.pointerId);
          const handleMove = (ev: PointerEvent) => {
            latest = updateFromPointer(ev.clientX, ev.clientY, el);
          };
          const handleUp = (ev: PointerEvent) => {
            if (el.hasPointerCapture(ev.pointerId)) {
              el.releasePointerCapture(ev.pointerId);
            }
            el.removeEventListener("pointermove", handleMove);
            el.removeEventListener("pointerup", handleUp);
            el.removeEventListener("pointercancel", handleUp);
            onCommit?.(xKey, latest.x);
            onCommit?.(yKey, latest.y);
          };

          el.addEventListener("pointermove", handleMove);
          el.addEventListener("pointerup", handleUp);
          el.addEventListener("pointercancel", handleUp);
        }}
        className="mt-xy-area"
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          position: "relative",
          borderRadius: 12,
          border: isDark
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(0,0,0,0.12)",
          backgroundColor: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.02)",
          backgroundImage: isDark
            ? "radial-gradient(circle at center, rgba(255,255,255,0.16) 1px, transparent 1.5px)"
            : "radial-gradient(circle at center, rgba(0,0,0,0.15) 1px, transparent 1.5px)",
          backgroundSize: "18px 18px",
          overflow: "hidden",
          touchAction: "none",
          cursor: "crosshair",
        }}
      >
        {/* Crosshair lines */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(22,100,255,0.35)",
            transform: "translateX(-0.5px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(22,100,255,0.35)",
            transform: "translateY(-0.5px)",
          }}
        />
        {/* Dot */}
        <div
          style={{
            position: "absolute",
            left: `${xPct}%`,
            top: `${yPct}%`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#22D3EE",
            boxShadow: isDark
              ? "0 0 0 3px rgba(34,211,238,0.24), 0 2px 8px rgba(0,0,0,0.48)"
              : "0 0 0 3px rgba(34,211,238,0.18), 0 2px 6px rgba(0,0,0,0.2)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
