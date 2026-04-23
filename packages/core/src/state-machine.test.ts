import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./events.js";
import { createStateMachine } from "./state-machine.js";

describe("EditorStateMachine", () => {
  it("starts in idle", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    expect(sm.getMode()).toBe("idle");
  });

  it("idle → selecting", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    expect(sm.getMode()).toBe("selecting");
  });

  it("selecting → editing via selectTarget", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.selectTarget("card");
    expect(sm.getMode()).toBe("editing");
  });

  it("editing → idle via exitEditor", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.selectTarget("card");
    sm.exitEditor();
    expect(sm.getMode()).toBe("idle");
  });

  it("selecting → idle via exitEditor", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.exitEditor();
    expect(sm.getMode()).toBe("idle");
  });

  it("throws on illegal transition: idle → editing", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    expect(() => sm.selectTarget("card")).toThrow("Invalid transition: idle → editing");
  });

  it("throws on illegal transition: editing → selecting", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.selectTarget("card");
    expect(() => sm.startSelecting()).toThrow("Invalid transition: editing → selecting");
  });

  it("emits mode-change on transition", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("mode-change", fn);
    const sm = createStateMachine(bus);
    sm.startSelecting();
    expect(fn).toHaveBeenCalledWith({ mode: "selecting", prev: "idle" });
  });

  it("emits select on selectTarget", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("select", fn);
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.selectTarget("card");
    expect(fn).toHaveBeenCalledWith({ targetId: "card" });
  });

  it("exitEditor is a no-op when already idle", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("mode-change", fn);
    const sm = createStateMachine(bus);
    sm.exitEditor();
    expect(fn).not.toHaveBeenCalled();
    expect(sm.getMode()).toBe("idle");
  });

  it("reset() force-resets to idle from any state", () => {
    const bus = createEventBus();
    const sm = createStateMachine(bus);
    sm.startSelecting();
    sm.selectTarget("card");
    sm.reset();
    expect(sm.getMode()).toBe("idle");
  });

  it("reset() emits mode-change", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("mode-change", fn);
    const sm = createStateMachine(bus);
    sm.startSelecting();
    fn.mockClear();
    sm.reset();
    expect(fn).toHaveBeenCalledWith({ mode: "idle", prev: "selecting" });
  });

  it("reset() is a no-op when already idle", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("mode-change", fn);
    const sm = createStateMachine(bus);
    sm.reset();
    expect(fn).not.toHaveBeenCalled();
  });
});
