import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./events.js";
import { createRegistry } from "./registry.js";
import { createConfigStore } from "./store.js";
import type { MotionTargetDef } from "./types.js";

const MOCK_DEF: MotionTargetDef = {
  id: "card",
  label: "Card",
  schema: [
    { key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "timing" },
    { key: "delay", label: "Delay", min: 0, max: 1, step: 0.01, group: "timing" },
  ],
  defaultConfig: { duration: 0.3, delay: 0 },
};

function setup() {
  const bus = createEventBus();
  const reg = createRegistry(bus);
  reg.register(MOCK_DEF, null);
  const store = createConfigStore(bus, reg);
  return { bus, reg, store };
}

describe("ConfigStore", () => {
  it("getConfig returns default when no changes", () => {
    const { store } = setup();
    expect(store.getConfig("card")).toEqual({ duration: 0.3, delay: 0 });
  });

  it("setParam updates a single value", () => {
    const { store } = setup();
    store.setParam("card", "duration", 0.5);
    expect(store.getConfig("card").duration).toBe(0.5);
  });

  it("setParam emits change event", () => {
    const { bus, store } = setup();
    const fn = vi.fn();
    bus.on("change", fn);
    store.setParam("card", "duration", 0.5);
    expect(fn).toHaveBeenCalledWith({ targetId: "card", key: "duration", value: 0.5 });
  });

  it("setConfig replaces entire config", () => {
    const { store } = setup();
    store.setConfig("card", { duration: 1, delay: 0.2 });
    expect(store.getConfig("card")).toEqual({ duration: 1, delay: 0.2 });
  });

  it("getDefaultConfig returns the registered default", () => {
    const { store } = setup();
    expect(store.getDefaultConfig("card")).toEqual({ duration: 0.3, delay: 0 });
  });

  it("getDefaultConfig returns {} for unknown target", () => {
    const { store } = setup();
    expect(store.getDefaultConfig("nope")).toEqual({});
  });

  it("getDiff returns changed params only", () => {
    const { store } = setup();
    store.setParam("card", "duration", 0.5);
    const diff = store.getDiff("card");
    expect(diff).toEqual([{ key: "duration", from: 0.3, to: 0.5 }]);
  });

  it("getDiff returns empty for no changes", () => {
    const { store } = setup();
    expect(store.getDiff("card")).toEqual([]);
  });

  it("resetConfig restores to default", () => {
    const { store } = setup();
    store.setParam("card", "duration", 1);
    store.resetConfig("card");
    expect(store.getConfig("card")).toEqual({ duration: 0.3, delay: 0 });
  });

  it("resetConfig emits change events", () => {
    const { bus, store } = setup();
    store.setParam("card", "duration", 1);
    const fn = vi.fn();
    bus.on("change", fn);
    store.resetConfig("card");
    expect(fn).toHaveBeenCalled();
  });

  it("getConfig returns a copy (not mutable)", () => {
    const { store } = setup();
    const cfg = store.getConfig("card");
    cfg.duration = 999;
    expect(store.getConfig("card").duration).toBe(0.3);
  });

  it("previewState defaults to null", () => {
    const { store } = setup();
    expect(store.getPreviewState("card")).toBeNull();
  });

  it("setPreviewState + getPreviewState", () => {
    const { store } = setup();
    store.setPreviewState("card", "hover");
    expect(store.getPreviewState("card")).toBe("hover");
  });

  it("setPreviewState emits state-change", () => {
    const { bus, store } = setup();
    const fn = vi.fn();
    bus.on("state-change", fn);
    store.setPreviewState("card", "hover");
    expect(fn).toHaveBeenCalledWith({ targetId: "card", state: "hover" });
  });

  it("getDiffAll aggregates across targets", () => {
    const { reg, store } = setup();
    const def2: MotionTargetDef = {
      id: "btn",
      label: "Button",
      schema: [{ key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.01, group: "transform" }],
      defaultConfig: { scale: 1 },
    };
    reg.register(def2, null);
    store.setParam("card", "duration", 0.5);
    store.setParam("btn", "scale", 1.2);
    const all = store.getDiffAll();
    expect(all.size).toBe(2);
    expect(all.get("card")).toEqual([{ key: "duration", from: 0.3, to: 0.5 }]);
    expect(all.get("btn")).toEqual([{ key: "scale", from: 1, to: 1.2 }]);
  });
});
