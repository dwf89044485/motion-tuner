// ── Vibeset — Main Entry ─────────────────────────────────────

// Core (framework-agnostic logic)
export {
  createVibeset,
  type Vibeset,
  type VibesetOptions,
  type MotionParamDef,
  type MotionStateDef,
  type MotionTargetDef,
  type EditorSessionMode,
  type ParamChange,
  type TargetChanges,
  type ChangeSet,
  type EventBus,
  type EventMap,
  type EventName,
  type TargetRegistry,
  type RegistryEntry,
  type ConfigStore,
  type EditorStateMachine,
  type ExportModule,
  type Bounds,
  createEventBus,
  createRegistry,
  createConfigStore,
  createStateMachine,
  createExportModule,
  clipToVisibleArea,
  measure,
  union,
  ZERO_BOUNDS,
} from "./core/index.js";

// Web Components (auto-registers custom elements on import)
export { registerComponents } from "./components/index.js";
