// ── Motion Tuner React — useEditorController ────────────────────

import { useState, useEffect, useCallback } from "react";
import type { EditorSessionMode, ChangeSet } from "motion-tuner-core";
import { useMotionTunerContext } from "./provider.js";

export interface EditorController {
  /** Enter selecting mode */
  startSelecting: () => void;
  /** Exit editor (back to idle) */
  exitEditor: () => void;
  /** Reset all configs to defaults */
  resetAll: () => void;
  /** Export all changes as structured JSON */
  exportChanges: () => ChangeSet;
  /** Export all changes as human-readable text */
  exportChangesAsText: () => string;
  /** Current editor mode */
  mode: EditorSessionMode;
  /** Total number of changed params across all targets */
  changeCount: number;
}

const NOOP_CONTROLLER: EditorController = {
  startSelecting: () => {},
  exitEditor: () => {},
  resetAll: () => {},
  exportChanges: () => ({ targets: [] }),
  exportChangesAsText: () => "No changes.",
  mode: "idle",
  changeCount: 0,
};

/**
 * Headless editor controller — provides mode transitions
 * and change management without any UI.
 *
 * Without Provider: returns a no-op controller.
 */
export function useEditorController(): EditorController {
  const ctx = useMotionTunerContext();
  const [mode, setMode] = useState<EditorSessionMode>("idle");
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    if (!ctx || !ctx.enabled) return;
    const { tuner } = ctx;

    // Sync mode
    setMode(tuner.getMode());
    const handleModeChange = (data: { mode: EditorSessionMode }) => {
      setMode(data.mode);
    };
    tuner.bus.on("mode-change", handleModeChange);

    // Track change count
    const updateChangeCount = () => {
      const cs = tuner.exportChanges();
      let count = 0;
      for (const t of cs.targets) count += t.changes.length;
      setChangeCount(count);
    };
    updateChangeCount();
    tuner.bus.on("change", updateChangeCount);

    return () => {
      tuner.bus.off("mode-change", handleModeChange);
      tuner.bus.off("change", updateChangeCount);
    };
  }, [ctx, ctx?.enabled]);

  const startSelecting = useCallback(() => {
    ctx?.tuner.startSelecting();
  }, [ctx]);

  const exitEditor = useCallback(() => {
    ctx?.tuner.exitEditor();
  }, [ctx]);

  const resetAll = useCallback(() => {
    ctx?.tuner.store.resetAll();
  }, [ctx]);

  const exportChanges = useCallback((): ChangeSet => {
    return ctx?.tuner.exportChanges() ?? { targets: [] };
  }, [ctx]);

  const exportChangesAsText = useCallback((): string => {
    return ctx?.tuner.exportChangesAsText() ?? "No changes.";
  }, [ctx]);

  if (!ctx || !ctx.enabled) return NOOP_CONTROLLER;

  return {
    startSelecting,
    exitEditor,
    resetAll,
    exportChanges,
    exportChangesAsText,
    mode,
    changeCount,
  };
}
