import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import {
  MotionTunerProvider,
  useMotionTuner,
  useEditorController,
  useMotionTunerContext,
} from "./index.js";
import type { MotionTargetDef } from "motion-tuner-core";

const CARD_DEF: MotionTargetDef = {
  id: "card",
  label: "Card",
  schema: [
    { key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "timing" },
  ],
  defaultConfig: { duration: 0.3 },
  states: [
    { value: "idle", label: "Idle" },
    { value: "hover", label: "Hover" },
  ],
  defaultState: "idle",
};

// Helper component that exposes hook results via callback
function TestTarget({
  onResult,
}: {
  onResult: (r: ReturnType<typeof useMotionTuner>) => void;
}) {
  const result = useMotionTuner("card", CARD_DEF);
  onResult(result);
  return React.createElement("div", { ref: result.ref }, "target");
}

function TestController({
  onResult,
}: {
  onResult: (r: ReturnType<typeof useEditorController>) => void;
}) {
  const ctrl = useEditorController();
  onResult(ctrl);
  return null;
}

describe("MotionTunerProvider", () => {
  it("renders children", () => {
    const { getByText } = render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement("div", null, "hello"),
      ),
    );
    expect(getByText("hello")).toBeDefined();
  });

  it("provides context to children", () => {
    let ctx: any = null;
    function Reader() {
      ctx = useMotionTunerContext();
      return null;
    }
    render(
      React.createElement(MotionTunerProvider, null, React.createElement(Reader)),
    );
    expect(ctx).not.toBeNull();
    expect(ctx.tuner).toBeDefined();
    expect(ctx.enabled).toBe(true);
    expect(ctx.zIndexBase).toBe(99990);
  });

  it("enabled=false still renders children", () => {
    const { getByText } = render(
      React.createElement(
        MotionTunerProvider,
        { enabled: false },
        React.createElement("div", null, "child"),
      ),
    );
    expect(getByText("child")).toBeDefined();
  });
});

describe("useMotionTuner", () => {
  it("returns default config without Provider", () => {
    let result: any;
    render(
      React.createElement(TestTarget, {
        onResult: (r: any) => { result = r; },
      }),
    );
    expect(result.config).toEqual({ duration: 0.3 });
    expect(result.previewState).toBe("idle");
  });

  it("returns default config with Provider", () => {
    let result: any;
    render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement(TestTarget, {
          onResult: (r: any) => { result = r; },
        }),
      ),
    );
    expect(result.config).toEqual({ duration: 0.3 });
  });

  it("reacts to config changes from core", () => {
    let result: any;
    let ctx: any;

    function Reader() {
      ctx = useMotionTunerContext();
      return null;
    }

    const { rerender } = render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement(Reader),
        React.createElement(TestTarget, {
          onResult: (r: any) => { result = r; },
        }),
      ),
    );

    // Modify via core
    act(() => {
      ctx.tuner.store.setParam("card", "duration", 0.8);
    });

    expect(result.config.duration).toBe(0.8);
  });

  it("reacts to preview state changes", () => {
    let result: any;
    let ctx: any;

    function Reader() {
      ctx = useMotionTunerContext();
      return null;
    }

    render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement(Reader),
        React.createElement(TestTarget, {
          onResult: (r: any) => { result = r; },
        }),
      ),
    );

    act(() => {
      ctx.tuner.store.setPreviewState("card", "hover");
    });

    expect(result.previewState).toBe("hover");
  });
});

describe("useEditorController", () => {
  it("returns noop controller without Provider", () => {
    let ctrl: any;
    render(
      React.createElement(TestController, {
        onResult: (r: any) => { ctrl = r; },
      }),
    );
    expect(ctrl.mode).toBe("idle");
    expect(ctrl.changeCount).toBe(0);
    // Should not throw
    ctrl.startSelecting();
    ctrl.exitEditor();
    ctrl.resetAll();
    expect(ctrl.exportChanges()).toEqual({ targets: [] });
    expect(ctrl.exportChangesAsText()).toBe("No changes.");
  });

  it("reflects mode changes", () => {
    let ctrl: any;
    let ctx: any;

    function Reader() {
      ctx = useMotionTunerContext();
      return null;
    }

    render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement(Reader),
        React.createElement(TestController, {
          onResult: (r: any) => { ctrl = r; },
        }),
      ),
    );

    expect(ctrl.mode).toBe("idle");

    act(() => {
      ctrl.startSelecting();
    });
    expect(ctrl.mode).toBe("selecting");

    act(() => {
      ctrl.exitEditor();
    });
    expect(ctrl.mode).toBe("idle");
  });

  it("tracks change count", () => {
    let ctrl: any;
    let ctx: any;

    function Reader() {
      ctx = useMotionTunerContext();
      return null;
    }

    render(
      React.createElement(
        MotionTunerProvider,
        null,
        React.createElement(Reader),
        React.createElement(TestTarget, { onResult: () => {} }),
        React.createElement(TestController, {
          onResult: (r: any) => { ctrl = r; },
        }),
      ),
    );

    expect(ctrl.changeCount).toBe(0);

    act(() => {
      ctx.tuner.store.setParam("card", "duration", 0.8);
    });

    expect(ctrl.changeCount).toBe(1);

    act(() => {
      ctx.tuner.store.resetAll();
    });

    expect(ctrl.changeCount).toBe(0);
  });
});
