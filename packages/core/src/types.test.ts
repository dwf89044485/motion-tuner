import { describe, it, expect } from "vitest";
import type { MotionParamDef, MotionTargetDef, EditorSessionMode, ChangeSet } from "./types.js";

describe("types", () => {
  it("MotionParamDef has required fields", () => {
    const param: MotionParamDef = {
      key: "duration",
      label: "动画时长",
      min: 0,
      max: 2,
      step: 0.01,
      group: "timing",
    };
    expect(param.key).toBe("duration");
  });

  it("MotionTargetDef composes from param defs", () => {
    const target: MotionTargetDef = {
      id: "my-card",
      label: "卡片",
      schema: [{ key: "duration", label: "时长", min: 0, max: 2, step: 0.01, group: "timing" }],
      defaultConfig: { duration: 0.3 },
    };
    expect(target.id).toBe("my-card");
    expect(target.schema).toHaveLength(1);
  });

  it("EditorSessionMode only allows motion modes", () => {
    const modes: EditorSessionMode[] = ["idle", "selecting", "editing"];
    expect(modes).toHaveLength(3);
  });

  it("ChangeSet has targets array", () => {
    const cs: ChangeSet = { targets: [] };
    expect(cs.targets).toHaveLength(0);
  });
});
