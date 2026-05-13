import { describe, it, expect } from "vitest";
import { createEventBus } from "./events.js";
import { createRegistry } from "./registry.js";
import { createConfigStore } from "./store.js";
import { createExportModule } from "./export.js";
import type { MotionTargetDef } from "./types.js";

const CARD_DEF: MotionTargetDef = {
  id: "card",
  label: "卡片",
  schema: [
    { key: "duration", label: "动画时长", min: 0, max: 2, step: 0.01, group: "timing" },
    { key: "delay", label: "延迟", min: 0, max: 1, step: 0.01, group: "timing" },
  ],
  defaultConfig: { duration: 0.3, delay: 0 },
};

const BTN_DEF: MotionTargetDef = {
  id: "btn",
  label: "按钮",
  schema: [
    { key: "scale", label: "缩放", min: 0.5, max: 2, step: 0.01, group: "transform" },
  ],
  defaultConfig: { scale: 1 },
};

function setup() {
  const bus = createEventBus();
  const reg = createRegistry(bus);
  reg.register(CARD_DEF, null);
  reg.register(BTN_DEF, null);
  const store = createConfigStore(bus, reg);
  const exporter = createExportModule(reg, store);
  return { bus, reg, store, exporter };
}

describe("ExportModule", () => {
  it("exportChanges returns empty when no changes", () => {
    const { exporter } = setup();
    expect(exporter.exportChanges()).toEqual({ targets: [] });
  });

  it("exportChanges returns changed targets only", () => {
    const { store, exporter } = setup();
    store.setParam("card", "duration", 0.5);
    const cs = exporter.exportChanges();
    expect(cs.targets).toHaveLength(1);
    expect(cs.targets[0].targetId).toBe("card");
    expect(cs.targets[0].targetLabel).toBe("卡片");
    expect(cs.targets[0].changes).toEqual([
      { key: "duration", from: 0.3, to: 0.5, label: "动画时长" },
    ]);
  });

  it("exportChanges includes multiple targets", () => {
    const { store, exporter } = setup();
    store.setParam("card", "duration", 0.5);
    store.setParam("btn", "scale", 1.5);
    const cs = exporter.exportChanges();
    expect(cs.targets).toHaveLength(2);
  });

  it("exportChangesAsText returns 'No changes.' when clean", () => {
    const { exporter } = setup();
    expect(exporter.exportChangesAsText()).toBe("No changes.");
  });

  it("exportChangesAsText formats correctly", () => {
    const { store, exporter } = setup();
    store.setParam("card", "duration", 0.5);
    store.setParam("btn", "scale", 1.5);
    const text = exporter.exportChangesAsText();
    expect(text).toContain("[卡片]");
    expect(text).toContain("动画时长: 0.3 → 0.5");
    expect(text).toContain("[按钮]");
    expect(text).toContain("缩放: 1 → 1.5");
  });
});
