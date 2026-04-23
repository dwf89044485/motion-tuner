import { describe, it, expect, vi } from "vitest";
import { createMotionTuner } from "./index.js";

describe("createMotionTuner", () => {
  it("creates an instance with all sub-modules", () => {
    const mt = createMotionTuner();
    expect(mt.bus).toBeDefined();
    expect(mt.registry).toBeDefined();
    expect(mt.store).toBeDefined();
    expect(mt.machine).toBeDefined();
    expect(mt.exporter).toBeDefined();
  });

  it("register + selectTarget + config workflow", () => {
    const mt = createMotionTuner();

    const unsub = mt.register(
      {
        id: "box",
        label: "Box",
        schema: [{ key: "opacity", label: "Opacity", min: 0, max: 1, step: 0.01, group: "visual" }],
        defaultConfig: { opacity: 1 },
      },
      null,
    );

    // Start selecting, then select
    mt.startSelecting();
    expect(mt.getMode()).toBe("selecting");

    mt.selectTarget("box");
    expect(mt.getMode()).toBe("editing");

    // Modify config
    mt.store.setParam("box", "opacity", 0.5);
    expect(mt.store.getConfig("box").opacity).toBe(0.5);

    // Export
    const cs = mt.exportChanges();
    expect(cs.targets).toHaveLength(1);
    expect(cs.targets[0].changes[0].to).toBe(0.5);

    const text = mt.exportChangesAsText();
    expect(text).toContain("Opacity: 1 → 0.5");

    // Exit
    mt.exitEditor();
    expect(mt.getMode()).toBe("idle");

    // Cleanup
    unsub();
    mt.destroy();
  });

  it("destroy clears all event listeners", () => {
    const mt = createMotionTuner();
    const fn = vi.fn();
    mt.bus.on("change", fn);
    mt.destroy();
    mt.bus.emit("change", { targetId: "x", key: "y", value: 0 });
    expect(fn).not.toHaveBeenCalled();
  });

  it("full round-trip: register → select → edit → export → reset → export", () => {
    const mt = createMotionTuner();

    mt.register(
      {
        id: "card",
        label: "Card",
        schema: [
          { key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "timing" },
          { key: "delay", label: "Delay", min: 0, max: 1, step: 0.01, group: "timing" },
        ],
        defaultConfig: { duration: 0.3, delay: 0 },
      },
      null,
    );

    // Edit
    mt.startSelecting();
    mt.selectTarget("card");
    mt.store.setParam("card", "duration", 0.8);
    mt.store.setParam("card", "delay", 0.1);

    expect(mt.exportChanges().targets[0].changes).toHaveLength(2);

    // Reset
    mt.store.resetConfig("card");
    expect(mt.exportChanges().targets).toHaveLength(0);
    expect(mt.exportChangesAsText()).toBe("No changes.");

    mt.destroy();
  });
});
