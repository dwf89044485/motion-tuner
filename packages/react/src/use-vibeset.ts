// ── Vibeset React — useVibeset ─────────────────────────

import { useRef, useEffect, useState, useCallback } from "react";
import type { MotionTargetDef } from "vibeset-core";
import { useVibesetContext } from "./provider.js";

export interface UseVibesetOptions {
  label?: string;
}

export interface UseVibesetResult {
  /** Attach to the component's root DOM element */
  ref: React.RefObject<HTMLElement | null>;
  /** Current motion config values — updates reactively */
  config: Record<string, number>;
  /** Current preview state (e.g. "hover", "active") — null if none */
  previewState: string | null;
  /** Increments each time a slider is committed (e.g. pointerup on slider).
   * Subscribe to this in useEffect to trigger a one-shot animation preview.
   * Format: `${key}:${value}:${seq}` — seq ensures unique values even for
   * same key+value successive commits. */
  lastCommit: string | null;
}

/**
 * Register a motion-tunable component with the SDK.
 *
 * On mount: registers with core. On unmount: auto-unregisters.
 * Without Provider: silently returns defaults (zero-overhead).
 */
export function useVibeset(
  id: string,
  schema: MotionTargetDef,
  options?: UseVibesetOptions,
): UseVibesetResult {
  const ctx = useVibesetContext();
  const ref = useRef<HTMLElement | null>(null);
  const [config, setConfig] = useState<Record<string, number>>(
    () => schema.defaultConfig,
  );
  const [previewState, setPreviewState] = useState<string | null>(
    () => schema.defaultState ?? null,
  );
  const [lastCommit, setLastCommit] = useState<string | null>(null);
  const commitSeqRef = useRef(0);

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

    const handleCommit = (data: { targetId: string; key: string; value: number }) => {
      if (data.targetId !== id) return;
      commitSeqRef.current += 1;
      setLastCommit(`${data.key}:${data.value}:${commitSeqRef.current}`);
    };

    tuner.bus.on("change", handleChange);
    tuner.bus.on("state-change", handleStateChange);
    tuner.bus.on("param-commit", handleCommit);

    return () => {
      tuner.bus.off("change", handleChange);
      tuner.bus.off("state-change", handleStateChange);
      tuner.bus.off("param-commit", handleCommit);
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

  return { ref, config, previewState, lastCommit };
}
