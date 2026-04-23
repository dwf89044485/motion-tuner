import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./events.js";
import { createRegistry } from "./registry.js";
import type { MotionTargetDef } from "./types.js";

const MOCK_DEF: MotionTargetDef = {
  id: "card",
  label: "Card",
  schema: [{ key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "timing" }],
  defaultConfig: { duration: 0.3 },
};

describe("TargetRegistry", () => {
  it("register + get", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    expect(reg.get("card")).toBeDefined();
    expect(reg.get("card")!.def.id).toBe("card");
  });

  it("register returns unregister function", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    const unsub = reg.register(MOCK_DEF, null);
    expect(reg.get("card")).toBeDefined();
    unsub();
    expect(reg.get("card")).toBeUndefined();
  });

  it("emits target-registered on register", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("target-registered", fn);
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    expect(fn).toHaveBeenCalledWith({ targetId: "card", def: MOCK_DEF });
  });

  it("emits target-unregistered on unregister", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("target-unregistered", fn);
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    reg.unregister("card");
    expect(fn).toHaveBeenCalledWith({ targetId: "card" });
  });

  it("unregister non-existent is a no-op", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    expect(() => reg.unregister("nope")).not.toThrow();
  });

  it("setActiveTarget / getActiveTarget / clearActiveTarget", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    expect(reg.getActiveTarget()).toBeNull();
    reg.setActiveTarget("card");
    expect(reg.getActiveTarget()).toBe("card");
    reg.clearActiveTarget();
    expect(reg.getActiveTarget()).toBeNull();
  });

  it("setActiveTarget ignores unknown id", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.setActiveTarget("nope");
    expect(reg.getActiveTarget()).toBeNull();
  });

  it("unregister active target clears it", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    reg.setActiveTarget("card");
    reg.unregister("card");
    expect(reg.getActiveTarget()).toBeNull();
  });

  it("getAll returns a copy", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    const all = reg.getAll();
    all.delete("card");
    expect(reg.get("card")).toBeDefined();
  });

  it("updateElement changes element ref", () => {
    const bus = createEventBus();
    const reg = createRegistry(bus);
    reg.register(MOCK_DEF, null);
    const el = {} as HTMLElement;
    reg.updateElement("card", el);
    expect(reg.get("card")!.element).toBe(el);
  });
});
