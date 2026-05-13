// ── Vibeset Core — ConfigStore ─────────────────────────────

import type { EventBus } from "./events.js";
import type { TargetRegistry } from "./registry.js";

export interface ConfigStore {
  getConfig(targetId: string): Record<string, number>;
  setParam(targetId: string, key: string, value: number): void;
  setConfig(targetId: string, config: Record<string, number>): void;
  getDefaultConfig(targetId: string): Record<string, number>;
  getDiff(targetId: string): Array<{ key: string; from: number; to: number }>;
  getDiffAll(): Map<string, Array<{ key: string; from: number; to: number }>>;
  resetConfig(targetId: string): void;
  resetAll(): void;
  /** Preview state per target */
  getPreviewState(targetId: string): string | null;
  setPreviewState(targetId: string, state: string): void;
}

export function createConfigStore(
  bus: EventBus,
  registry: TargetRegistry,
): ConfigStore {
  const configs = new Map<string, Record<string, number>>();
  const previewStates = new Map<string, string>();

  function ensureConfig(targetId: string): Record<string, number> {
    let cfg = configs.get(targetId);
    if (!cfg) {
      cfg = { ...getDefaultConfig(targetId) };
      configs.set(targetId, cfg);
    }
    return cfg;
  }

  function getDefaultConfig(targetId: string): Record<string, number> {
    const entry = registry.get(targetId);
    return entry ? { ...entry.def.defaultConfig } : {};
  }

  return {
    getConfig(targetId) {
      return { ...ensureConfig(targetId) };
    },

    setParam(targetId, key, value) {
      const cfg = ensureConfig(targetId);
      cfg[key] = value;
      bus.emit("change", { targetId, key, value });
    },

    setConfig(targetId, config) {
      configs.set(targetId, { ...config });
      // Emit change for each key
      for (const [key, value] of Object.entries(config)) {
        bus.emit("change", { targetId, key, value });
      }
    },

    getDefaultConfig,

    getDiff(targetId) {
      const cfg = ensureConfig(targetId);
      const def = getDefaultConfig(targetId);
      const diffs: Array<{ key: string; from: number; to: number }> = [];
      for (const key of Object.keys(def)) {
        if (cfg[key] !== def[key]) {
          diffs.push({ key, from: def[key], to: cfg[key] });
        }
      }
      return diffs;
    },

    getDiffAll() {
      const result = new Map<string, Array<{ key: string; from: number; to: number }>>();
      for (const [id] of registry.getAll()) {
        const diff = this.getDiff(id);
        if (diff.length > 0) result.set(id, diff);
      }
      return result;
    },

    resetConfig(targetId) {
      const def = getDefaultConfig(targetId);
      configs.set(targetId, { ...def });
      for (const [key, value] of Object.entries(def)) {
        bus.emit("change", { targetId, key, value });
      }
    },

    resetAll() {
      for (const [id] of registry.getAll()) {
        this.resetConfig(id);
      }
    },

    getPreviewState(targetId) {
      return previewStates.get(targetId) ?? null;
    },

    setPreviewState(targetId, state) {
      previewStates.set(targetId, state);
      bus.emit("state-change", { targetId, state });
    },
  };
}
