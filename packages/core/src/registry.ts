// ── Motion Tuner Core — TargetRegistry ──────────────────────────

import type { MotionTargetDef } from "./types.js";
import type { EventBus } from "./events.js";

export interface RegistryEntry {
  def: MotionTargetDef;
  element: HTMLElement | null;
}

export interface TargetRegistry {
  register(def: MotionTargetDef, element: HTMLElement | null): () => void;
  unregister(id: string): void;
  get(id: string): RegistryEntry | undefined;
  getAll(): Map<string, RegistryEntry>;
  setActiveTarget(id: string): void;
  clearActiveTarget(): void;
  getActiveTarget(): string | null;
  /** Update the DOM element reference for a target */
  updateElement(id: string, element: HTMLElement | null): void;
}

export function createRegistry(bus: EventBus): TargetRegistry {
  const entries = new Map<string, RegistryEntry>();
  let activeTargetId: string | null = null;

  return {
    register(def, element) {
      entries.set(def.id, { def, element });
      bus.emit("target-registered", { targetId: def.id, def });
      return () => this.unregister(def.id);
    },

    unregister(id) {
      if (!entries.has(id)) return;
      entries.delete(id);
      if (activeTargetId === id) activeTargetId = null;
      bus.emit("target-unregistered", { targetId: id });
    },

    get(id) {
      return entries.get(id);
    },

    getAll() {
      return new Map(entries);
    },

    setActiveTarget(id) {
      if (!entries.has(id)) return;
      activeTargetId = id;
    },

    clearActiveTarget() {
      activeTargetId = null;
    },

    getActiveTarget() {
      return activeTargetId;
    },

    updateElement(id, element) {
      const entry = entries.get(id);
      if (entry) entry.element = element;
    },
  };
}
