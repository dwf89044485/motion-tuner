// ── Motion Tuner UI — EditorRuntime ─────────────────────────────
// One-stop component: drop inside MotionTunerProvider to get
// the full editing experience (overlay + panel + launcher).

import React, { useCallback, useState } from "react";
import { useMotionTunerContext } from "motion-tuner-react";
import { useEditorController } from "motion-tuner-react";
import { OverlayLayer } from "./overlay-layer.js";
import { Launcher } from "./launcher.js";
import { MotionPanel } from "./motion-panel.js";
import type { MotionTunerTheme } from "./theme.js";

export interface EditorRuntimeProps {
  theme?: MotionTunerTheme;
}

export function EditorRuntime({ theme = "dark" }: EditorRuntimeProps) {
  const ctx = useMotionTunerContext();
  const ctrl = useEditorController();
  const [panelTheme, setPanelTheme] = useState<MotionTunerTheme>(theme);

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
          targetLabel={activeEntry.def.label}
          schema={activeEntry.def.schema}
          config={tuner.store.getConfig(activeId!)}
          defaultConfig={activeEntry.def.defaultConfig}
          onChange={handlePanelChange}
          stateOptions={activeEntry.def.states}
          selectedState={
            tuner.store.getPreviewState(activeId!) ??
            activeEntry.def.defaultState
          }
          onStateChange={handleStateChange}
          theme={panelTheme}
          onClose={handleClose}
          portalRoot={ctx.portalRoot}
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
