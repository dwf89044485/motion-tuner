// ── Vibeset UI — Slider ────────────────────────────────────
// Native <input type="range"> with custom CSS.
// No framer-motion. Supports drag-to-adjust on the value display.

import React, { useState, useRef, useCallback, useId } from "react";
import type { ThemeTokens } from "./theme.js";
import { MONO_FONT } from "./theme.js";

// ── StepButton ──────────────────────────────────────────────────

function StepButton({
  direction,
  isDark,
  onClick,
}: {
  direction: "minus" | "plus";
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "minus" ? "减少" : "增加"}
      className="mt-step-btn"
      style={{
        width: 16,
        height: 16,
        border: isDark
          ? "1px solid rgba(255,255,255,0.18)"
          : "1px solid rgba(0,0,0,0.10)",
        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.03)",
        borderRadius: 4,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        flexShrink: 0,
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 600,
        color: isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.40)",
        transition: "all 100ms",
        fontFamily: MONO_FONT,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = isDark
          ? "rgba(255,255,255,0.92)"
          : "rgba(0,0,0,0.7)";
        e.currentTarget.style.background = isDark
          ? "rgba(255,255,255,0.14)"
          : "rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isDark
          ? "rgba(255,255,255,0.62)"
          : "rgba(0,0,0,0.40)";
        e.currentTarget.style.background = isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.03)";
      }}
    >
      {direction === "minus" ? "\u2212" : "+"}
    </button>
  );
}

// ── EditableValue ───────────────────────────────────────────────

function EditableValue({
  value,
  decimals,
  isDefault,
  isDark,
  min,
  max,
  step,
  onCommit,
}: {
  value: number;
  decimals: number;
  isDefault: boolean;
  isDark: boolean;
  min: number;
  max: number;
  step: number;
  onCommit: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const startEdit = () => {
    setDraft(value.toFixed(decimals));
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onCommit(clamp(parsed));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit();
      return;
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      setEditing(false);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const parsed = parseFloat(draft);
      if (isNaN(parsed)) return;
      const s = e.shiftKey ? step * 10 : step;
      const delta = e.key === "ArrowUp" ? s : -s;
      const next = clamp(parsed + delta);
      setDraft(next.toFixed(decimals));
      onCommit(next);
    }
  };

  // Drag-to-adjust on the value display
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startVal = value;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const s = ev.shiftKey ? step * 0.1 : step;
        const next = clamp(startVal + Math.round(dx * s * 10) / 10);
        onCommit(next);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [value, min, max, step, onCommit, clamp, decimals],
  );

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="mt-editable-input"
        style={{
          width: 38,
          height: 16,
          fontSize: 11,
          fontWeight: 500,
          fontFamily: MONO_FONT,
          textAlign: "center",
          border: isDark
            ? "1px solid rgba(255,255,255,0.28)"
            : "1px solid rgba(0,0,0,0.18)",
          borderRadius: 3,
          outline: "none",
          background: isDark ? "rgba(15,18,24,0.95)" : "#fff",
          color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
          padding: "0 2px",
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      onMouseDown={handleDragStart}
      title="点击编辑数值，或左右拖动调整"
      className="mt-editable-value"
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: isDefault
          ? isDark
            ? "rgba(255,255,255,0.42)"
            : "rgba(0,0,0,0.4)"
          : isDark
            ? "rgba(255,255,255,0.85)"
            : "rgba(0,0,0,0.7)",
        fontFamily: MONO_FONT,
        minWidth: 32,
        textAlign: "center",
        transition: "color 100ms",
        cursor: "ew-resize",
        borderRadius: 3,
        padding: "0 2px",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark
          ? "rgba(255,255,255,0.1)"
          : "rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {value.toFixed(decimals)}
    </span>
  );
}

// ── Slider (exported) ───────────────────────────────────────────

export interface SliderProps {
  paramKey: string;
  label: string;
  keyName: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  tokens: ThemeTokens;
  isDark: boolean;
  onChange: (key: string, value: number) => void;
  onCommit?: (key: string, value: number) => void;
  onReset?: (key: string) => void;
  /** Show the camelCase key alongside label (default true). Set false for 纯中文 label experience */
  showKeyName?: boolean;
}

export function Slider({
  paramKey,
  label,
  keyName,
  value,
  defaultValue,
  min,
  max,
  step,
  tokens,
  isDark,
  onChange,
  onCommit,
  onReset,
  showKeyName = true,
}: SliderProps) {
  const sliderId = useId();
  const cls = `mt-slider-${sliderId.replace(/:/g, "")}`;
  const pct = ((value - min) / (max - min)) * 100;
  const isDefault = value === defaultValue;
  const decimals = step < 1 ? 2 : 0;

  const clampAndSet = (raw: number) => {
    const clamped = Math.min(max, Math.max(min, raw));
    const rounded = parseFloat(clamped.toFixed(decimals));
    onChange(paramKey, rounded);
    onCommit?.(paramKey, rounded);
  };

  return (
    <div
      className="mt-slider"
      style={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <style>{`
        .${cls} {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          margin: 6px 0;
          padding: 0;
          border: none;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          vertical-align: middle;
        }
        .${cls}::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: transparent;
        }
        .${cls}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 8px;
          height: 16px;
          margin-top: -6px;
          border-radius: 4px;
          background: ${tokens.sliderThumbBg};
          border: 1.5px solid ${tokens.sliderThumbBorder};
          box-shadow: ${tokens.sliderThumbShadow};
          cursor: pointer;
          transition: border-color 120ms, box-shadow 120ms, transform 120ms;
        }
        .${cls}::-webkit-slider-thumb:hover {
          border-color: ${tokens.sliderThumbBorderHover};
          box-shadow: ${tokens.sliderThumbShadowHover};
          transform: scaleX(1.15);
        }
        .${cls}::-webkit-slider-thumb:active {
          border-color: ${tokens.sliderThumbBorderActive};
          transform: scaleY(0.9);
        }
        .${cls}::-moz-range-track {
          height: 4px;
          border: none;
          border-radius: 2px;
          background: ${tokens.sliderTrack};
        }
        .${cls}::-moz-range-progress {
          height: 4px;
          border-radius: 2px;
          background: ${tokens.sliderProgress};
        }
        .${cls}::-moz-range-thumb {
          width: 8px;
          height: 16px;
          border-radius: 4px;
          background: ${tokens.sliderThumbBg};
          border: 1.5px solid ${tokens.sliderThumbBorder};
          box-shadow: ${tokens.sliderThumbShadow};
          cursor: pointer;
        }
      `}</style>

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
          {showKeyName && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: tokens.textMuted,
                fontFamily: MONO_FONT,
              }}
            >
              {keyName}
            </span>
          )}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {!isDefault && onReset && (
            <button
              onClick={() => onReset(paramKey)}
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
          <StepButton
            direction="minus"
            isDark={isDark}
            onClick={() => clampAndSet(value - step)}
          />
          <EditableValue
            value={value}
            decimals={decimals}
            isDefault={isDefault}
            isDark={isDark}
            min={min}
            max={max}
            step={step}
            onCommit={clampAndSet}
          />
          <StepButton
            direction="plus"
            isDark={isDark}
            onClick={() => clampAndSet(value + step)}
          />
        </div>
      </div>

      <input
        type="range"
        className={cls}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(paramKey, parseFloat(e.target.value))}
        onMouseUp={(e) =>
          onCommit?.(paramKey, parseFloat(e.currentTarget.value))
        }
        style={{
          background: `linear-gradient(to right, ${tokens.sliderProgress} 0%, ${tokens.sliderProgress} ${pct}%, ${tokens.sliderTrack} ${pct}%, ${tokens.sliderTrack} 100%)`,
        }}
      />
    </div>
  );
}
