import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./events.js";

describe("EventBus", () => {
  it("calls handler on emit", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("change", fn);
    bus.emit("change", { targetId: "a", key: "x", value: 1 });
    expect(fn).toHaveBeenCalledWith({ targetId: "a", key: "x", value: 1 });
  });

  it("does not call handler after off()", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("change", fn);
    bus.off("change", fn);
    bus.emit("change", { targetId: "a", key: "x", value: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it("supports multiple handlers", () => {
    const bus = createEventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on("mode-change", fn1);
    bus.on("mode-change", fn2);
    bus.emit("mode-change", { mode: "selecting", prev: "idle" });
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it("handler can safely off() during emit", () => {
    const bus = createEventBus();
    const fn1 = vi.fn(() => bus.off("change", fn1));
    const fn2 = vi.fn();
    bus.on("change", fn1);
    bus.on("change", fn2);
    bus.emit("change", { targetId: "a", key: "x", value: 1 });
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it("clear() removes all listeners", () => {
    const bus = createEventBus();
    const fn = vi.fn();
    bus.on("change", fn);
    bus.on("select", fn);
    bus.clear();
    bus.emit("change", { targetId: "a", key: "x", value: 1 });
    bus.emit("select", { targetId: "a" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("emit with no listeners is a no-op", () => {
    const bus = createEventBus();
    expect(() => bus.emit("change", { targetId: "a", key: "x", value: 1 })).not.toThrow();
  });
});
