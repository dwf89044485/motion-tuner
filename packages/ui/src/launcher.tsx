// ── Motion Tuner UI — Launcher ───────────────────────────────────
// Bottom-right floating button. Native drag, no framer-motion.
// Shows mode-dependent content: entry point / selecting hint / editing controls.

import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { EditorSessionMode } from "motion-tuner-core";
import { getTokens, FONT, type MotionTunerTheme } from "./theme.js";

// ── Inline icons ────────────────────────────────────────────────

function IconPointerClick({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      <path d="M2 2l8 8" />
    </svg>
  );
}

function IconSparkles({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" />
      <path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function IconLogOut({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconX({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function IconCopy({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 8H10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z" />
      <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
    </svg>
  );
}

function IconRotate({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

// ── Launcher component ──────────────────────────────────────────

export interface LauncherProps {
  mode: EditorSessionMode;
  theme?: MotionTunerTheme;
  changeCount?: number;
  onStartSelecting: () => void;
  onReselect: () => void;
  onExitEditor: () => void;
  onResetAll?: () => void;
  onCopyChanges?: () => void;
  portalRoot?: HTMLElement | null;
  zIndexBase?: number;
}

export function Launcher({
  mode,
  theme = "dark",
  changeCount = 0,
  onStartSelecting,
  onReselect,
  onExitEditor,
  onResetAll,
  onCopyChanges,
  portalRoot,
  zIndexBase = 99990,
}: LauncherProps) {
  const isDark = theme === "dark";
  const [expanded, setExpanded] = useState(false);
  const isIdle = mode === "idle";
  const isSelecting = mode === "selecting";
  const isEditing = mode === "editing";
  const isCollapsed = isIdle && !expanded;

  // ── Native drag ─────────────────────────────────────────────

  const [pos, setPos] = useState({ bottom: 24, right: 24 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startBottom: number;
    startRight: number;
    moved: boolean;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, [role=button]")) return;
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startBottom: pos.bottom,
        startRight: pos.right,
        moved: false,
      };
    },
    [pos],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setPos({
      bottom: dragRef.current.startBottom - dy,
      right: dragRef.current.startRight - dx,
    });
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasDrag = dragRef.current?.moved;
      dragRef.current = null;
      if (!wasDrag && isCollapsed) {
        setExpanded(true);
      }
    },
    [isCollapsed],
  );

  // ── Pill style ────────────────────────────────────────────────

  const pillStyle: React.CSSProperties = {
    height: 44,
    borderRadius: 22,
    border: isDark
      ? "1px solid rgba(255,255,255,0.20)"
      : "1px solid rgba(0,0,0,0.14)",
    background: isDark
      ? "linear-gradient(180deg, rgba(24,27,34,0.96) 0%, rgba(10,12,16,0.97) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(242,245,251,0.96) 100%)",
    boxShadow: isDark
      ? "0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)"
      : "0 8px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.86)",
    display: "flex",
    alignItems: "center",
    color: isDark ? "rgba(255,255,255,0.96)" : "rgba(0,0,0,0.76)",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: FONT,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    padding: 4,
    whiteSpace: "nowrap",
    touchAction: "none",
    cursor: isCollapsed ? "pointer" : "grab",
  };

  const btnStyle = (muted = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 36,
    padding: "0 10px",
    borderRadius: 18,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: FONT,
    color: muted
      ? isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"
      : isDark ? "rgba(255,255,255,0.94)" : "rgba(0,0,0,0.76)",
    transition: "background 120ms",
    whiteSpace: "nowrap",
    outline: "none",
  });

  const iconBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    transition: "background 120ms",
    flexShrink: 0,
    outline: "none",
    color: "inherit",
  };

  const dividerStyle: React.CSSProperties = {
    width: 1,
    height: 20,
    background: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)",
    flexShrink: 0,
    margin: "0 4px",
  };

  const hoverBg = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)";

  // ── Content by mode ───────────────────────────────────────────

  let content: React.ReactNode;
  if (isCollapsed) {
    content = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 4 }}>
        <IconPointerClick size={16} />
        Motion Tuner
      </div>
    );
  } else if (isIdle && expanded) {
    content = (
      <>
        <button
          style={btnStyle()}
          onClick={onStartSelecting}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconSparkles /> Motion Edit
        </button>
        <span style={dividerStyle} />
        <button
          style={iconBtnStyle}
          onClick={() => setExpanded(false)}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconX />
        </button>
      </>
    );
  } else if (isSelecting) {
    content = (
      <>
        <span style={{ ...btnStyle(true), cursor: "default" }}>Select a component</span>
        <button
          style={btnStyle()}
          onClick={onExitEditor}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconLogOut /> Exit
        </button>
      </>
    );
  } else if (isEditing) {
    content = (
      <>
        <button
          style={btnStyle()}
          onClick={onReselect}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconPointerClick size={14} /> Reselect
        </button>
        <button
          style={btnStyle()}
          onClick={onExitEditor}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <IconLogOut /> Exit
        </button>
        {changeCount > 0 && (
          <>
            <span style={dividerStyle} />
            <span style={{ ...btnStyle(true), cursor: "default" }}>{changeCount} changes</span>
            {onCopyChanges && (
              <button
                style={iconBtnStyle}
                onClick={onCopyChanges}
                title="Copy changes"
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <IconCopy />
              </button>
            )}
            {onResetAll && (
              <button
                style={iconBtnStyle}
                onClick={onResetAll}
                title="Reset all"
                onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <IconRotate />
              </button>
            )}
          </>
        )}
      </>
    );
  }

  const root = portalRoot ?? (typeof document !== "undefined" ? document.body : null);
  if (!root) return null;

  return createPortal(
    <div
      className="mt-launcher"
      data-editor-ui=""
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        ...pillStyle,
        position: "fixed",
        bottom: pos.bottom,
        right: pos.right,
        zIndex: zIndexBase + 9,
        // Width transition
        width: isCollapsed ? 148 : "auto",
        minWidth: isCollapsed ? 148 : 148,
        transition: "width 0.24s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {content}
    </div>,
    root,
  );
}
