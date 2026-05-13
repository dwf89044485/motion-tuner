// ── Vibeset Core — Type Protocol ──────────────────────────

/** Single parameter definition */
export interface MotionParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  group: string;
  /** Only show this param in these states */
  states?: string[];
  /** Auto-switch to this state when expanding the param's group */
  linkedState?: string;
  /** Control type: slider (default) or xy (2D drag pad) */
  control?: "slider" | "xy";
  /** When control=xy, the Y-axis param key */
  pairKey?: string;
  /** Render a divider before this param */
  dividerBefore?: boolean;
}

/** State option for a target (e.g. "hover", "active", "closed") */
export interface MotionStateDef {
  value: string;
  label: string;
}

/** Schema that a component registers with */
export interface MotionTargetDef {
  id: string;
  label: string;
  schema: MotionParamDef[];
  defaultConfig: Record<string, number>;
  states?: MotionStateDef[];
  defaultState?: string;
}

/** Editor session modes — motion-only for v1 */
export type EditorSessionMode =
  | "idle"
  | "selecting"
  | "editing";

/** A single parameter change */
export interface ParamChange {
  key: string;
  from: number;
  to: number;
  label: string;
}

/** Changes for one target */
export interface TargetChanges {
  targetId: string;
  targetLabel: string;
  changes: ParamChange[];
}

/** Structured export format */
export interface ChangeSet {
  targets: TargetChanges[];
}
