// ── Vibeset Core — EditorStateMachine ──────────────────────

import type { EditorSessionMode } from "./types.js";
import type { EventBus } from "./events.js";

const VALID_TRANSITIONS: Record<EditorSessionMode, EditorSessionMode[]> = {
  idle: ["selecting"],
  selecting: ["editing", "idle"],
  editing: ["idle"],
};

export interface EditorStateMachine {
  getMode(): EditorSessionMode;
  startSelecting(): void;
  selectTarget(targetId: string): void;
  exitEditor(): void;
  reset(): void;
}

export function createStateMachine(bus: EventBus): EditorStateMachine {
  let mode: EditorSessionMode = "idle";

  function transition(next: EditorSessionMode) {
    if (!VALID_TRANSITIONS[mode].includes(next)) {
      throw new Error(`Invalid transition: ${mode} → ${next}`);
    }
    const prev = mode;
    mode = next;
    bus.emit("mode-change", { mode, prev });
  }

  return {
    getMode() {
      return mode;
    },

    startSelecting() {
      transition("selecting");
    },

    selectTarget(targetId) {
      transition("editing");
      bus.emit("select", { targetId });
    },

    exitEditor() {
      if (mode === "idle") return;
      transition("idle");
    },

    reset() {
      if (mode === "idle") return;
      const prev = mode;
      mode = "idle";
      bus.emit("mode-change", { mode: "idle", prev });
    },
  };
}
