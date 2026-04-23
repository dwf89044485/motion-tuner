// ── Motion Tuner React — useMotionTuner ─────────────────────────

import { useRef, useEffect, useState, useCallback } from "react";
import type { MotionTargetDef } from "motion-tuner-core";
import { useMotionTunerContext } from "./provider.js";

export interface UseMotionTunerOptions {
  label?: string;
}

export interface UseMotionTunerResult {
  /** Attach to the component's root DOM element */
  ref: React.RefObject<HTMLElement | null>;
  /** Current motion config values — updates reactively */
  config: Record<string, number>;
  /** Current preview state (e.g. "hover", "active") — null if none */
  previewState: string | null;
}

/**
 * Register a motion-tunable component with the SDK.
 *
 * On mount: registers with core. On unmount: auto-unregisters.
 * Without Provider: silently returns defaults (zero-overhead).
 */
export function useMotionTuner(
  id: string,
  schema: MotionTargetDef,
  options?: UseMotionTunerOptions,
): UseMotionTunerResult {
  const ctx = useMotionTunerContext();
  const ref = useRef<HTMLElement | null>(null);
  const [config, setConfig] = useState<Record<string, number>>(
    () => schema.defaultConfig,
  );
  const [previewState, setPreviewState] = useState<string | null>(
    () => schema.defaultState ?? null,
  );

  // Register / unregister with core
  useEffect(() => {
    if (!ctx || !ctx.enabled) return;
    const { tuner } = ctx;

    const unregister = tuner.register(schema, ref.current);

    // Sync element ref after mount
    if (ref.current) {
      tuner.registry.updateElement(id, ref.current);
    }

    // Listen for config changes on this target
    const handleChange = (data: { targetId: string; key: string; value: number }) => {
      if (data.targetId !== id) return;
      setConfig((prev) => ({ ...prev, [data.key]: data.value }));
    };

    const handleStateChange = (data: { targetId: string; state: string }) => {
      if (data.targetId !== id) return;
      setPreviewState(data.state);
    };

    tuner.bus.on("change", handleChange);
    tuner.bus.on("state-change", handleStateChange);

    return () => {
      tuner.bus.off("change", handleChange);
      tuner.bus.off("state-change", handleStateChange);
      unregister();
    };
  }, [ctx, ctx?.enabled, id, schema]);

  // Keep element ref in sync when DOM updates
  const setRef = useCallback(
    (el: HTMLElement | null) => {
      ref.current = el;
      if (ctx?.enabled && el) {
        ctx.tuner.registry.updateElement(id, el);
      }
    },
    [ctx, id],
  );

  // Use callback ref pattern — return an object with .current for compatibility
  // but also expose setRef for direct use
  const callbackRef = useRef<HTMLElement | null>(null);
  callbackRef.current = ref.current;

  return { ref, config, previewState };
}
