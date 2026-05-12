// ── Motion Tuner UI — MotionPanel ───────────────────────────────
// Parameter editing panel. Pure CSS transitions, no framer-motion.
// Renders via portal. Draggable via native mousedown.

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { MotionParamDef, MotionStateDef } from "motion-tuner-core";
import { Slider } from "./slider.js";
import { XYPad } from "./xy-pad.js";
import {
  getTokens,
  getStateSelectorTokens,
  FONT,
  type MotionTunerTheme,
} from "./theme.js";

export interface MotionPanelProps {
  /** Target id (used in copy output for AI to grep & locate the schema) */
  targetId?: string;
  targetLabel: string;
  schema: MotionParamDef[];
  config: Record<string, number>;
  defaultConfig: Record<string, number>;
  onChange: (config: Record<string, number>) => void;
  stateOptions?: MotionStateDef[];
  selectedState?: string;
  onStateChange?: (state: string) => void;
  onSliderCommit?: (key: string, value: number) => void;
  theme?: MotionTunerTheme;
  onClose: () => void;
  /** Portal mount point. Default: document.body */
  portalRoot?: HTMLElement | null;
  /** Initial position. Default: { top: 20, right: 20 } */
  initialPosition?: { top: number; left: number };
  /** Show the camelCase param key next to each slider label (default true).
   * Set false for 纯中文 label experience. */
  showKeyName?: boolean;
}

export function MotionPanel({
  targetId,
  targetLabel,
  schema,
  config,
  defaultConfig,
  onChange,
  stateOptions,
  selectedState,
  onStateChange,
  onSliderCommit,
  theme = "dark",
  onClose,
  portalRoot,
  initialPosition,
  showKeyName = true,
}: MotionPanelProps) {
  const tokens = getTokens(theme);
  const stateTokens = getStateSelectorTokens(theme);
  const isDark = theme === "dark";

  // Panel visibility state for CSS transition entrance/exit
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Trigger entrance on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // ── Drag state (native mousedown) ─────────────────────────────

  const [pos, setPos] = useState(() =>
    initialPosition ?? { top: 20, left: window.innerWidth - 320 - 20 },
  );
  const dragRef = useRef<{ startX: number; startY: number; startTop: number; startLeft: number } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag when clicking buttons
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startTop: pos.top,
        startLeft: pos.left,
      };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        setPos({
          top: dragRef.current.startTop + dy,
          left: dragRef.current.startLeft + dx,
        });
      };

      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [pos],
  );

  // ── Accordion state ───────────────────────────────────────────

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const p of schema) {
      if (!(p.group in init)) init[p.group] = true;
    }
    // 默认展开「基础」分组；若不存在则展开首个分组
    if ("基础" in init) {
      init["基础"] = false;
    } else {
      const first = Object.keys(init)[0];
      if (first) init[first] = false;
    }
    return init;
  });

  const [copyFeedback, setCopyFeedback] = useState<"copy" | "reset" | null>(null);

  const toggleGroup = useCallback(
    (label: string, linkedState?: string) => {
      setCollapsedGroups((prev) => {
        const isCollapsed = prev[label] ?? true;
        if (isCollapsed) {
          // Accordion: expand this, collapse others
          const next: Record<string, boolean> = {};
          for (const key of Object.keys(prev)) next[key] = true;
          next[label] = false;
          return next;
        }
        return { ...prev, [label]: true };
      });
      // LinkedState: auto-switch state on expand
      const isCollapsed = collapsedGroups[label] ?? true;
      if (isCollapsed && linkedState && onStateChange) {
        onStateChange(linkedState);
      }
    },
    [collapsedGroups, onStateChange],
  );

  // Build groups from schema, filter by selectedState
  const groups = useMemo(() => {
    const result: { label: string; params: MotionParamDef[]; linkedState?: string }[] = [];
    const map = new Map<string, MotionParamDef[]>();
    for (const p of schema) {
      if (p.states && selectedState && !p.states.includes(selectedState)) continue;
      let arr = map.get(p.group);
      if (!arr) {
        arr = [];
        map.set(p.group, arr);
        result.push({ label: p.group, params: arr, linkedState: p.linkedState });
      }
      arr.push(p);
    }
    return result;
  }, [schema, selectedState]);

  // Auto-expand group when selectedState changes
  useEffect(() => {
    if (!selectedState) return;
    const match = groups.find((g) => g.linkedState === selectedState);
    if (match) {
      setCollapsedGroups((prev) => {
        const next: Record<string, boolean> = {};
        for (const key of Object.keys(prev)) next[key] = true;
        next[match.label] = false;
        return next;
      });
    }
  }, [selectedState, groups]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleSliderChange = (key: string, value: number) => {
    onChange({ ...config, [key]: value });
  };

  const handleResetParam = (key: string) => {
    onChange({ ...config, [key]: defaultConfig[key] });
  };

  const handleResetXY = (xKey: string, yKey: string) => {
    onChange({
      ...config,
      [xKey]: defaultConfig[xKey],
      [yKey]: defaultConfig[yKey],
    });
    onSliderCommit?.(xKey, defaultConfig[xKey]);
    onSliderCommit?.(yKey, defaultConfig[yKey]);
  };

  const handleResetAll = () => {
    onChange({ ...defaultConfig });
    setCopyFeedback("reset");
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const hasAnyChange = schema.some((p) => config[p.key] !== defaultConfig[p.key]);

  const handleCopy = () => {
    if (!hasAnyChange) return;
    const changed = schema.filter((p) => config[p.key] !== defaultConfig[p.key]);

    // AI-friendly format: directly paste-able TS object that maps to defaultConfig.
    // Includes target id (for grep) + label + comments with old values.
    const idLine = targetId ? ` (id: "${targetId}")` : "";
    const lines = changed.map((p) => {
      const oldV = defaultConfig[p.key];
      const newV = config[p.key];
      // pad key for visual alignment
      return `  ${p.key}: ${newV},  // ${p.label} · was ${oldV}`;
    });
    const text =
      `// motion-tuner: ${changed.length} change(s) for "${targetLabel}"${idLine}\n` +
      `// Apply to defaultConfig (find the MotionTargetDef whose id matches above):\n` +
      `{\n${lines.join("\n")}\n}\n`;

    navigator.clipboard.writeText(text);
    setCopyFeedback("copy");
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  // ── Render param ──────────────────────────────────────────────

  const renderParam = (param: MotionParamDef) => {
    if (param.control === "xy" && param.pairKey) {
      return (
        <React.Fragment key={param.key}>
          {param.dividerBefore && (
            <div style={{ borderTop: `1px solid ${tokens.dividerStrong}`, paddingTop: 10, marginTop: 4 }} />
          )}
          <XYPad
            xKey={param.key}
            yKey={param.pairKey}
            label={param.label}
            xValue={config[param.key] ?? defaultConfig[param.key]}
            yValue={config[param.pairKey] ?? defaultConfig[param.pairKey]}
            defaultX={defaultConfig[param.key] ?? 0}
            defaultY={defaultConfig[param.pairKey] ?? 0}
            min={param.min}
            max={param.max}
            step={param.step}
            tokens={tokens}
            isDark={isDark}
            onChange={handleSliderChange}
            onCommit={onSliderCommit}
            onReset={handleResetXY}
          />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment key={param.key}>
        {param.dividerBefore && (
          <div style={{ borderTop: `1px solid ${tokens.dividerStrong}`, paddingTop: 10, marginTop: 4 }} />
        )}
        <Slider
          paramKey={param.key}
          label={param.label}
          keyName={param.key}
          value={config[param.key] ?? defaultConfig[param.key]}
          defaultValue={defaultConfig[param.key] ?? 0}
          min={param.min}
          max={param.max}
          step={param.step}
          tokens={tokens}
          isDark={isDark}
          onChange={handleSliderChange}
          onCommit={onSliderCommit}
          onReset={handleResetParam}
          showKeyName={showKeyName}
        />
      </React.Fragment>
    );
  };

  // ── Portal content ────────────────────────────────────────────

  const content = (
    <div
      ref={panelRef}
      className="mt-panel"
      data-state={visible ? "open" : "closed"}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 300,
        borderRadius: 12,
        backgroundColor: tokens.panelBg,
        backdropFilter: "blur(13px) saturate(90%)",
        WebkitBackdropFilter: "blur(13px) saturate(90%)",
        border: `1px solid ${tokens.panelBorder}`,
        boxShadow: tokens.panelShadow,
        overflow: "hidden",
        fontFamily: FONT,
        zIndex: 99998,
        // CSS transition entrance
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.6) translateY(40px)",
        transition: "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* ── Header (draggable) ── */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: `1px solid ${tokens.divider}`,
          userSelect: "none",
          cursor: "grab",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
          {targetLabel}
        </span>
        <button
          onClick={onClose}
          className="mt-close-btn"
          style={{
            width: 20,
            height: 20,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            color: tokens.textTertiary,
            borderRadius: 4,
            transition: "color 100ms, background 100ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = tokens.buttonTextHover;
            e.currentTarget.style.background = tokens.buttonBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = tokens.textTertiary;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* ── State selector ── */}
      {stateOptions && selectedState !== undefined && onStateChange && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderBottom: `1px solid ${tokens.divider}` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: tokens.textTertiary, letterSpacing: "0.02em" }}>
            组件状态
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 4,
              borderRadius: 40,
              background: stateTokens.containerBg,
              border: stateTokens.containerBorder,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {stateOptions.map((opt) => {
              const active = opt.value === selectedState;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStateChange(opt.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: "none",
                    borderRadius: 40,
                    padding: "4px 10px",
                    fontSize: 12,
                    lineHeight: "20px",
                    fontWeight: active ? 600 : 400,
                    color: active ? stateTokens.itemActiveText : stateTokens.itemBaseText,
                    background: active ? stateTokens.itemActiveBg : stateTokens.itemBaseBg,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    transition: "background-color 150ms, color 150ms",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Parameter groups ── */}
      <div style={{ maxHeight: "60vh", overflowY: "auto", overflowX: "hidden" }}>
        {groups.map((group) => {
          const singleGroup = groups.length === 1;
          const isCollapsed = singleGroup ? false : (collapsedGroups[group.label] ?? true);
          return (
            <div key={group.label} style={{ borderBottom: singleGroup ? undefined : `1px solid ${tokens.dividerSoft}` }}>
              {!singleGroup && (
                <button
                  onClick={() => toggleGroup(group.label, group.linkedState)}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: tokens.textTertiary,
                    fontFamily: FONT,
                    transition: "background 100ms",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = tokens.dividerSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span
                    style={{
                      display: "inline-block",
                      transition: "transform 200ms",
                      transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)",
                      fontSize: 9,
                    }}
                  >
                    &#9654;
                  </span>
                  <span>{group.label}</span>
                  <span style={{ fontSize: 9, color: tokens.textMuted, fontWeight: 400 }}>
                    {group.params.length}
                  </span>
                </button>
              )}

              {/* Accordion body — CSS max-height transition */}
              <div
                data-state={isCollapsed ? "closed" : "open"}
                style={{
                  maxHeight: isCollapsed ? 0 : 1000,
                  opacity: isCollapsed ? 0 : 1,
                  overflow: "hidden",
                  transition: "max-height 0.2s cubic-bezier(0.4,0,0.2,1), opacity 0.2s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div
                  style={{
                    padding: singleGroup ? "6px 12px 10px" : "2px 12px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {group.params.map(renderParam)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${tokens.divider}`, padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 10, color: tokens.textMuted, marginBottom: 6 }}>
          {hasAnyChange
            ? `${schema.filter((p) => config[p.key] !== defaultConfig[p.key]).length} changes`
            : "No changes"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => { if (hasAnyChange) handleResetAll(); }}
            onMouseEnter={(e) => {
              if (hasAnyChange) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            style={{
              flex: 1,
              height: 28,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`,
              borderRadius: 8,
              background: "transparent",
              color: hasAnyChange ? tokens.textSecondary : tokens.textMuted,
              fontSize: 11,
              fontWeight: 500,
              cursor: hasAnyChange ? "pointer" : "default",
              fontFamily: FONT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 100ms",
            }}
          >
            {copyFeedback === "reset" ? "\u2713 已重置" : "重置"}
          </button>
          <button
            onClick={handleCopy}
            onMouseEnter={(e) => {
              if (hasAnyChange) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            style={{
              flex: 1,
              height: 28,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`,
              borderRadius: 8,
              background: "transparent",
              color: hasAnyChange ? tokens.textSecondary : tokens.textMuted,
              fontSize: 11,
              fontWeight: 500,
              cursor: hasAnyChange ? "pointer" : "default",
              fontFamily: FONT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 100ms",
            }}
          >
            {copyFeedback === "copy" ? "\u2713 已复制" : "复制代码"}
          </button>
        </div>
      </div>
    </div>
  );

  const root = portalRoot ?? (typeof document !== "undefined" ? document.body : null);
  if (!root) return null;
  return createPortal(content, root);
}
