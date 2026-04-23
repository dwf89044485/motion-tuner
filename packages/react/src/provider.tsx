// ── Motion Tuner React — Provider ───────────────────────────────

import React, { createContext, useContext, useEffect, useRef, useMemo } from "react";
import { createMotionTuner } from "motion-tuner-core";
import type { MotionTuner } from "motion-tuner-core";

export interface MotionTunerContextValue {
  tuner: MotionTuner;
  enabled: boolean;
  portalRoot: HTMLElement | null;
  zIndexBase: number;
}

export const MotionTunerContext = createContext<MotionTunerContextValue | null>(null);

export interface MotionTunerProviderProps {
  children: React.ReactNode;
  /** When false, hooks silently return defaults and no UI is rendered */
  enabled?: boolean;
  /** Portal mount point for panels/overlays. Default: document.body */
  portalRoot?: HTMLElement;
  /** Base z-index for all SDK layers. Default: 99990 */
  zIndexBase?: number;
}

export function MotionTunerProvider({
  children,
  enabled = true,
  portalRoot,
  zIndexBase = 99990,
}: MotionTunerProviderProps) {
  const tunerRef = useRef<MotionTuner | null>(null);
  if (!tunerRef.current) {
    tunerRef.current = createMotionTuner();
  }

  // Global Escape handler
  useEffect(() => {
    if (!enabled) return;
    const tuner = tunerRef.current!;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        tuner.exitEditor();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    const tuner = tunerRef.current!;
    return () => tuner.destroy();
  }, []);

  const value = useMemo<MotionTunerContextValue>(
    () => ({
      tuner: tunerRef.current!,
      enabled,
      portalRoot: portalRoot ?? null,
      zIndexBase,
    }),
    [enabled, portalRoot, zIndexBase],
  );

  return React.createElement(MotionTunerContext.Provider, { value }, children);
}

/** Internal hook — get context or null (for graceful degradation) */
export function useMotionTunerContext(): MotionTunerContextValue | null {
  return useContext(MotionTunerContext);
}
