// ── Motion Tuner Core — EventBus ────────────────────────────────

import type { EditorSessionMode, MotionTargetDef } from "./types.js";

/** All event types the bus can emit */
export interface EventMap {
  /** A param value changed */
  change: { targetId: string; key: string; value: number };
  /** Preview state changed for a target */
  "state-change": { targetId: string; state: string };
  /** A target was selected in selecting mode */
  select: { targetId: string };
  /** Editor session mode changed */
  "mode-change": { mode: EditorSessionMode; prev: EditorSessionMode };
  /** A target was registered */
  "target-registered": { targetId: string; def: MotionTargetDef };
  /** A target was unregistered */
  "target-unregistered": { targetId: string };
}

export type EventName = keyof EventMap;
type Handler<T> = (data: T) => void;

export interface EventBus {
  on<K extends EventName>(event: K, handler: Handler<EventMap[K]>): void;
  off<K extends EventName>(event: K, handler: Handler<EventMap[K]>): void;
  emit<K extends EventName>(event: K, data: EventMap[K]): void;
  /** Remove all listeners (cleanup) */
  clear(): void;
}

export function createEventBus(): EventBus {
  const listeners = new Map<EventName, Set<Handler<any>>>();

  return {
    on(event, handler) {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(handler);
    },

    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },

    emit(event, data) {
      const set = listeners.get(event);
      if (!set) return;
      // Iterate a snapshot so handlers can safely off() during emit
      for (const fn of [...set]) {
        fn(data);
      }
    },

    clear() {
      listeners.clear();
    },
  };
}
