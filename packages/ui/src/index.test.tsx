import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MotionPanel, Slider, XYPad, getTokens, DARK_TOKENS, LIGHT_TOKENS, EditorRuntime, Launcher } from "./index.js";
import type { MotionParamDef } from "motion-tuner-core";

const TOKENS = getTokens("dark");

describe("Slider", () => {
  it("renders with label and value", () => {
    const { getByText } = render(
      React.createElement(Slider, {
        paramKey: "duration",
        label: "Duration",
        keyName: "duration",
        value: 0.3,
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.01,
        tokens: TOKENS,
        isDark: true,
        onChange: () => {},
      }),
    );
    expect(getByText("Duration")).toBeDefined();
    expect(getByText("0.30")).toBeDefined();
  });

  it("shows reset button when value differs from default", () => {
    const { container } = render(
      React.createElement(Slider, {
        paramKey: "duration",
        label: "Duration",
        keyName: "duration",
        value: 0.8,
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.01,
        tokens: TOKENS,
        isDark: true,
        onChange: () => {},
        onReset: () => {},
      }),
    );
    const resetBtn = container.querySelector(".mt-reset-btn");
    expect(resetBtn).not.toBeNull();
  });
});

describe("XYPad", () => {
  it("renders with label and coordinates", () => {
    const { getByText } = render(
      React.createElement(XYPad, {
        xKey: "x",
        yKey: "y",
        label: "Position",
        xValue: 0.5,
        yValue: 0.5,
        defaultX: 0.5,
        defaultY: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
        tokens: TOKENS,
        isDark: true,
        onChange: () => {},
      }),
    );
    expect(getByText("Position")).toBeDefined();
    expect(getByText("0.50, 0.50")).toBeDefined();
  });
});

describe("MotionPanel", () => {
  it("renders target label and parameters", () => {
    const schema: MotionParamDef[] = [
      { key: "duration", label: "Duration", min: 0, max: 2, step: 0.01, group: "timing" },
    ];
    const { getByText } = render(
      React.createElement(MotionPanel, {
        targetLabel: "Card",
        schema,
        config: { duration: 0.3 },
        defaultConfig: { duration: 0.3 },
        onChange: () => {},
        onClose: () => {},
      }),
    );
    expect(getByText("Card")).toBeDefined();
    expect(getByText("Duration")).toBeDefined();
  });

  it("shows footer with no changes text", () => {
    const schema: MotionParamDef[] = [
      { key: "d", label: "D", min: 0, max: 1, step: 0.01, group: "g" },
    ];
    const { getByText } = render(
      React.createElement(MotionPanel, {
        targetLabel: "T",
        schema,
        config: { d: 0.5 },
        defaultConfig: { d: 0.5 },
        onChange: () => {},
        onClose: () => {},
      }),
    );
    expect(getByText("No changes")).toBeDefined();
  });

  it("shows change count when values differ", () => {
    const schema: MotionParamDef[] = [
      { key: "d", label: "D", min: 0, max: 1, step: 0.01, group: "g" },
      { key: "e", label: "E", min: 0, max: 1, step: 0.01, group: "g" },
    ];
    const { getByText } = render(
      React.createElement(MotionPanel, {
        targetLabel: "T",
        schema,
        config: { d: 0.8, e: 0.5 },
        defaultConfig: { d: 0.5, e: 0.5 },
        onChange: () => {},
        onClose: () => {},
      }),
    );
    expect(getByText("1 changes")).toBeDefined();
  });
});

describe("theme", () => {
  it("getTokens returns dark tokens for dark theme", () => {
    expect(getTokens("dark")).toBe(DARK_TOKENS);
  });

  it("getTokens returns light tokens for light theme", () => {
    expect(getTokens("light")).toBe(LIGHT_TOKENS);
  });
});

describe("EditorRuntime", () => {
  it("returns null without Provider", () => {
    const { container } = render(React.createElement(EditorRuntime));
    expect(container.innerHTML).toBe("");
  });
});

describe("Launcher", () => {
  it("renders in idle mode", () => {
    const { getByText } = render(
      React.createElement(Launcher, {
        mode: "idle",
        onStartSelecting: () => {},
        onReselect: () => {},
        onExitEditor: () => {},
      }),
    );
    expect(getByText("Motion Tuner")).toBeDefined();
  });

  it("renders in selecting mode", () => {
    const { getByText } = render(
      React.createElement(Launcher, {
        mode: "selecting",
        onStartSelecting: () => {},
        onReselect: () => {},
        onExitEditor: () => {},
      }),
    );
    expect(getByText("Select a component")).toBeDefined();
    expect(getByText("Exit")).toBeDefined();
  });
});
