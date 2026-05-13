// ── Vibeset UI — OverlayLayer ──────────────────────────────
// Selection-mode overlay. Highlights registered targets on hover,
// selects on click. Pure CSS transitions, no framer-motion.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { measure, type Bounds, ZERO_BOUNDS } from "vibeset-core";
import { useVibesetContext } from "vibeset-react";
import type { RegistryEntry } from "vibeset-core";
import { FONT } from "./theme.js";

const PAD = 12;
const BLUE = "22, 100, 255";
const BORDER_IDLE = `1.5px dashed rgba(${BLUE}, 0.35)`;
const BORDER_HOVER = `1.5px dashed rgba(${BLUE}, 0.6)`;
const BG_IDLE = `rgba(${BLUE}, 0.04)`;
const BG_HOVER = `rgba(${BLUE}, 0.08)`;
const SHADOW_HOVER = `0 2px 12px rgba(${BLUE}, 0.12)`;
const LABEL_BG = `rgba(${BLUE}, 0.85)`;

interface TargetRect {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function OverlayLayer({
  onSelect,
  portalRoot,
  zIndexBase = 99990,
}: {
  onSelect: (targetId: string) => void;
  portalRoot?: HTMLElement | null;
  zIndexBase?: number;
}) {
  const ctx = useVibesetContext();
  const [targets, setTargets] = useState<TargetRect[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const rafRef = useRef<number>(0);

  // Continuously measure target positions
  useEffect(() => {
    if (!ctx) return;
    const { tuner } = ctx;

    let frameCount = 0;
    const tick = () => {
      frameCount++;
      // Throttle: measure every 3rd frame (~20fps)
      if (frameCount % 3 === 0) {
        const all = tuner.registry.getAll();
        const rects: TargetRect[] = [];
        for (const [id, entry] of all) {
          if (!entry.element) continue;
          const bounds = measure(entry.element);
          const er = entry.element.getBoundingClientRect();
          rects.push({
            id,
            label: entry.def.label,
            top: er.top + bounds.top - PAD,
            left: er.left + bounds.left - PAD,
            width: er.width + bounds.right - bounds.left + PAD * 2,
            height: er.height + bounds.bottom - bounds.top + PAD * 2,
          });
        }
        setTargets(rects);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ctx]);

  const root = portalRoot ?? (typeof document !== "undefined" ? document.body : null);
  if (!root) return null;

  return createPortal(
    <div
      className="mt-overlay-layer"
      data-motion-overlay=""
      style={{
        position: "fixed",
        inset: 0,
        zIndex: zIndexBase + 5,
        pointerEvents: "none",
      }}
    >
      {targets.map((t) => {
        const isHovered = hoveredId === t.id;
        return (
          <div
            key={t.id}
            data-motion-overlay=""
            onClick={() => onSelect(t.id)}
            onMouseEnter={() => setHoveredId(t.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "fixed",
              top: t.top,
              left: t.left,
              width: t.width,
              height: t.height,
              border: isHovered ? BORDER_HOVER : BORDER_IDLE,
              background: isHovered ? BG_HOVER : BG_IDLE,
              boxShadow: isHovered ? SHADOW_HOVER : "none",
              borderRadius: 8,
              cursor: "pointer",
              pointerEvents: "auto",
              transition: "border 150ms, background 150ms, box-shadow 150ms",
            }}
          >
            {/* Label */}
            <div
              data-motion-overlay=""
              style={{
                position: "absolute",
                top: -10,
                left: 8,
                padding: "2px 8px",
                borderRadius: 4,
                background: LABEL_BG,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: FONT,
                lineHeight: "16px",
                whiteSpace: "nowrap",
                opacity: isHovered ? 1 : 0.7,
                transition: "opacity 150ms",
              }}
            >
              {t.label}
            </div>
          </div>
        );
      })}
    </div>,
    root,
  );
}
