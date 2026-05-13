// ── Vibeset UI — EditorRuntime ─────────────────────────────
// One-stop component: drop inside VibesetProvider to get
// the full editing experience (overlay + panel + launcher).

import React, { useCallback, useState, useEffect } from "react";
import { useVibesetContext } from "vibeset-react";
import { useEditorController } from "vibeset-react";
import { OverlayLayer } from "./overlay-layer.js";
import { Launcher } from "./launcher.js";
import { MotionPanel } from "./motion-panel.js";
import type { VibesetTheme } from "./theme.js";

export interface EditorRuntimeProps {
  theme?: VibesetTheme;
  /** Show the camelCase param key next to each slider label (default true).
   * Set false for 纯中文 label experience. */
  showKeyName?: boolean;
}

export function EditorRuntime({ theme = "dark", showKeyName = true }: EditorRuntimeProps) {
  const ctx = useVibesetContext();
  const ctrl = useEditorController();
  const [panelTheme, setPanelTheme] = useState<VibesetTheme>(theme);

  // Force re-render when store changes (so the panel reads the latest config)
  const [, setStoreRev] = useState(0);
  useEffect(() => {
    if (!ctx || !ctx.enabled) return;
    const { tuner } = ctx;
    const bump = () => setStoreRev((r) => r + 1);
    tuner.bus.on("change", bump);
    tuner.bus.on("state-change", bump);
    tuner.bus.on("target-registered", bump);
    tuner.bus.on("target-unregistered", bump);
    return () => {
      tuner.bus.off("change", bump);
      tuner.bus.off("state-change", bump);
      tuner.bus.off("target-registered", bump);
      tuner.bus.off("target-unregistered", bump);
    };
  }, [ctx, ctx?.enabled]);

  if (!ctx || !ctx.enabled) return null;

  const { tuner } = ctx;
  const activeId = tuner.registry.getActiveTarget();
  const activeEntry = activeId ? tuner.registry.get(activeId) : null;

  const handleSelect = useCallback(
    (targetId: string) => {
      tuner.selectTarget(targetId);
    },
    [tuner],
  );

  const handleReselect = useCallback(() => {
    tuner.exitEditor();
    tuner.startSelecting();
  }, [tuner]);

  const handlePanelChange = useCallback(
    (config: Record<string, number>) => {
      if (!activeId) return;
      tuner.store.setConfig(activeId, config);
    },
    [tuner, activeId],
  );

  const handleSliderCommit = useCallback(
    (key: string, value: number) => {
      if (!activeId) return;
      tuner.bus.emit("param-commit", { targetId: activeId, key, value });
    },
    [tuner, activeId],
  );

  const handleStateChange = useCallback(
    (state: string) => {
      if (!activeId) return;
      tuner.store.setPreviewState(activeId, state);
    },
    [tuner, activeId],
  );

  const handleClose = useCallback(() => {
    tuner.exitEditor();
  }, [tuner]);

  const handleCopy = useCallback(() => {
    const text = tuner.exportChangesAsText();
    navigator.clipboard.writeText(text);
  }, [tuner]);

  const handleResetAll = useCallback(() => {
    tuner.store.resetAll();
  }, [tuner]);

  return (
    <>
      {/* Overlay — only in selecting mode */}
      {ctrl.mode === "selecting" && (
        <OverlayLayer
          onSelect={handleSelect}
          portalRoot={ctx.portalRoot}
          zIndexBase={ctx.zIndexBase}
        />
      )}

      {/* Panel — only in editing mode with active target */}
      {ctrl.mode === "editing" && activeEntry && (
        <MotionPanel
          targetId={activeId!}
          targetLabel={activeEntry.def.label}
          schema={activeEntry.def.schema}
          config={tuner.store.getConfig(activeId!)}
          defaultConfig={activeEntry.def.defaultConfig}
          onChange={handlePanelChange}
          onSliderCommit={handleSliderCommit}
          stateOptions={activeEntry.def.states}
          selectedState={
            tuner.store.getPreviewState(activeId!) ??
            activeEntry.def.defaultState
          }
          onStateChange={handleStateChange}
          theme={panelTheme}
          onClose={handleClose}
          portalRoot={ctx.portalRoot}
          showKeyName={showKeyName}
        />
      )}

      {/* Launcher — always visible */}
      <Launcher
        mode={ctrl.mode}
        theme={panelTheme}
        changeCount={ctrl.changeCount}
        onStartSelecting={ctrl.startSelecting}
        onReselect={handleReselect}
        onExitEditor={ctrl.exitEditor}
        onResetAll={handleResetAll}
        onCopyChanges={handleCopy}
        portalRoot={ctx.portalRoot}
        zIndexBase={ctx.zIndexBase}
      />
    </>
  );
}
