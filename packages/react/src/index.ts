import React, { createContext, useContext } from "react";
import type { MotionTargetDef, EditorSessionMode } from "motion-tuner-core";

// ── Context ────────────────────────────────────────────────────

interface MotionTunerContextValue {
  enabled: boolean;
  portalRoot: HTMLElement;
  zIndexBase: number;
}

const MotionTunerContext = createContext<MotionTunerContextValue | null>(null);

// ── Provider (placeholder — Phase 2 will implement) ────────────

export function MotionTunerProvider(_props: {
  children: React.ReactNode;
  enabled?: boolean;
  portalRoot?: HTMLElement;
  zIndexBase?: number;
}) {
  return null as unknown as React.ReactElement;
}

// ── Hook (placeholder — Phase 2 will implement) ────────────────

export function useMotionTuner(
  _id: string,
  _schema: MotionTargetDef,
  _options?: { label?: string }
): {
  ref: React.RefObject<HTMLElement | null>;
  config: Record<string, number>;
  previewState: string | null;
} {
  return { ref: { current: null }, config: {}, previewState: null };
}

// ── Headless controller (placeholder — Phase 2 will implement) ──

export function useEditorController(): {
  startSelecting: () => void;
  exitEditor: () => void;
  resetAll: () => void;
  mode: EditorSessionMode;
} {
  return {
    startSelecting: () => {},
    exitEditor: () => {},
    resetAll: () => {},
    mode: "idle" as EditorSessionMode,
  };
}
