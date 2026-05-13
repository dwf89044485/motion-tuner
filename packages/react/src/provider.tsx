// ── Vibeset React — Provider ───────────────────────────────

import React, { createContext, useContext, useEffect, useRef, useMemo } from "react";
import { createVibeset } from "vibeset-core";
import type { Vibeset } from "vibeset-core";

export interface VibesetContextValue {
  tuner: Vibeset;
  enabled: boolean;
  portalRoot: HTMLElement | null;
  zIndexBase: number;
}

export const VibesetContext = createContext<VibesetContextValue | null>(null);

export interface VibesetProviderProps {
  children: React.ReactNode;
  /** When false, hooks silently return defaults and no UI is rendered */
  enabled?: boolean;
  /** Portal mount point for panels/overlays. Default: document.body */
  portalRoot?: HTMLElement;
  /** Base z-index for all SDK layers. Default: 99990 */
  zIndexBase?: number;
}

export function VibesetProvider({
  children,
  enabled = true,
  portalRoot,
  zIndexBase = 99990,
}: VibesetProviderProps) {
  const tunerRef = useRef<Vibeset | null>(null);
  if (!tunerRef.current) {
    tunerRef.current = createVibeset();
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

  const value = useMemo<VibesetContextValue>(
    () => ({
      tuner: tunerRef.current!,
      enabled,
      portalRoot: portalRoot ?? null,
      zIndexBase,
    }),
    [enabled, portalRoot, zIndexBase],
  );

  return React.createElement(VibesetContext.Provider, { value }, children);
}

/** Internal hook — get context or null (for graceful degradation) */
export function useVibesetContext(): VibesetContextValue | null {
  return useContext(VibesetContext);
}
