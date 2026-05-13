// ── Vibeset Core — Public API ──────────────────────────────

import { createEventBus } from "./events.js";
import { createRegistry } from "./registry.js";
import { createConfigStore } from "./store.js";
import { createStateMachine } from "./state-machine.js";
import { createExportModule } from "./export.js";

import type { EventBus, EventMap, EventName } from "./events.js";
import type { TargetRegistry, RegistryEntry } from "./registry.js";
import type { ConfigStore } from "./store.js";
import type { EditorStateMachine } from "./state-machine.js";
import type { ExportModule } from "./export.js";
import type { EditorSessionMode, MotionTargetDef, ChangeSet } from "./types.js";

// ── Re-export types ─────────────────────────────────────────────

export type {
  MotionParamDef,
  MotionStateDef,
  MotionTargetDef,
  EditorSessionMode,
  ParamChange,
  TargetChanges,
  ChangeSet,
} from "./types.js";

export type { EventBus, EventMap, EventName } from "./events.js";
export type { TargetRegistry, RegistryEntry } from "./registry.js";
export type { ConfigStore } from "./store.js";
export type { EditorStateMachine } from "./state-machine.js";
export type { ExportModule } from "./export.js";
export type { Bounds } from "./measure.js";

// ── Re-export measure utilities (pure functions, no factory) ────

export { clipToVisibleArea, measure, union, ZERO_BOUNDS } from "./measure.js";

// ── Re-export factory helpers for advanced use ──────────────────

export { createEventBus } from "./events.js";
export { createRegistry } from "./registry.js";
export { createConfigStore } from "./store.js";
export { createStateMachine } from "./state-machine.js";
export { createExportModule } from "./export.js";

// ── Main factory ────────────────────────────────────────────────

export interface VibesetOptions {
  /** Reserved for future options */
}

export interface Vibeset {
  /** Event bus — subscribe to changes, mode transitions, etc. */
  bus: EventBus;
  /** Target registration */
  registry: TargetRegistry;
  /** Parameter config storage */
  store: ConfigStore;
  /** Editor session state machine */
  machine: EditorStateMachine;
  /** Change export */
  exporter: ExportModule;

  // ── Convenience methods (delegate to sub-modules) ──

  /** Register a target, returns unregister function */
  register(def: MotionTargetDef, element: HTMLElement | null): () => void;
  /** Get current editor mode */
  getMode(): EditorSessionMode;
  /** Enter selecting mode */
  startSelecting(): void;
  /** Select a target (transitions to editing) */
  selectTarget(targetId: string): void;
  /** Exit editor (back to idle) */
  exitEditor(): void;
  /** Export all changes as structured JSON */
  exportChanges(): ChangeSet;
  /** Export all changes as human-readable text */
  exportChangesAsText(): string;
  /** Tear down — remove all listeners and state */
  destroy(): void;
}

export function createVibeset(_options?: VibesetOptions): Vibeset {
  const bus = createEventBus();
  const registry = createRegistry(bus);
  const store = createConfigStore(bus, registry);
  const machine = createStateMachine(bus);
  const exporter = createExportModule(registry, store);

  return {
    bus,
    registry,
    store,
    machine,
    exporter,

    register(def, element) {
      return registry.register(def, element);
    },

    getMode() {
      return machine.getMode();
    },

    startSelecting() {
      machine.startSelecting();
    },

    selectTarget(targetId) {
      registry.setActiveTarget(targetId);
      machine.selectTarget(targetId);
    },

    exitEditor() {
      registry.clearActiveTarget();
      machine.exitEditor();
    },

    exportChanges() {
      return exporter.exportChanges();
    },

    exportChangesAsText() {
      return exporter.exportChangesAsText();
    },

    destroy() {
      bus.clear();
    },
  };
}
