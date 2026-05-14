// ── Vibeset React Binding ────────────────────────────────────
// Thin bridge: React Context → core store → <vibeset-editor> Web Component

// Side-effect: register all Web Components so <vibeset-editor> is available
import "../components/index.js";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  createElement,
} from "react";
import type { ReactNode, RefObject } from "react";
import { createVibeset } from "../core/index.js";
import type {
  Vibeset,
  MotionTargetDef,
  EditorSessionMode,
  ChangeSet,
} from "../core/index.js";

// ── Context ──────────────────────────────────────────────────

interface VibesetContextValue {
  store: Vibeset;
  enabled: boolean;
}

const VibesetCtx = createContext<VibesetContextValue | null>(null);

function useVibesetContext(): VibesetContextValue | null {
  return useContext(VibesetCtx);
}

// ── Provider ─────────────────────────────────────────────────

export interface VibesetProviderProps {
  children: ReactNode;
  enabled?: boolean;
  theme?: "dark" | "light";
  showKeyName?: boolean;
}

export function VibesetProvider({
  children,
  enabled = true,
  theme = "dark",
  showKeyName = false,
}: VibesetProviderProps) {
  const storeRef = useRef<Vibeset | null>(null);
  if (!storeRef.current) {
    storeRef.current = createVibeset();
  }

  const editorRef = useRef<HTMLElement>(null);

  // Inject store into Web Component
  useEffect(() => {
    if (!enabled || !editorRef.current) return;
    (editorRef.current as any).store = storeRef.current;
  }, [enabled]);

  // Global Escape handler
  useEffect(() => {
    if (!enabled) return;
    const store = storeRef.current!;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") store.exitEditor();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    const store = storeRef.current!;
    return () => store.destroy();
  }, []);

  const value = useMemo<VibesetContextValue>(
    () => ({ store: storeRef.current!, enabled }),
    [enabled],
  );

  return createElement(
    VibesetCtx.Provider,
    { value },
    enabled
      ? createElement("vibeset-editor", {
          ref: editorRef,
          theme,
          "show-key-name": showKeyName ? "" : undefined,
        })
      : null,
    children,
  );
}

// ── useVibeset ───────────────────────────────────────────────

export interface UseVibesetResult {
  ref: RefObject<HTMLElement | null>;
  config: Record<string, number>;
  previewState: string | null;
  lastCommit: string | null;
}

export function useVibeset(
  id: string,
  schema: MotionTargetDef,
): UseVibesetResult {
  const ctx = useVibesetContext();
  const ref = useRef<HTMLElement | null>(null);
  const [config, setConfig] = useState<Record<string, number>>(
    () => schema.defaultConfig,
  );
  const [previewState, setPreviewState] = useState<string | null>(
    () => schema.defaultState ?? null,
  );
  const [lastCommit, setLastCommit] = useState<string | null>(null);
  const commitSeqRef = useRef(0);

  useEffect(() => {
    if (!ctx || !ctx.enabled) return;
    const { store } = ctx;

    const unregister = store.register(schema, ref.current);

    if (ref.current) {
      store.registry.updateElement(id, ref.current);
    }

    const handleChange = (data: { targetId: string; key: string; value: number }) => {
      if (data.targetId !== id) return;
      setConfig((prev) => ({ ...prev, [data.key]: data.value }));
    };

    const handleStateChange = (data: { targetId: string; state: string }) => {
      if (data.targetId !== id) return;
      setPreviewState(data.state);
    };

    const handleCommit = (data: { targetId: string; key: string; value: number }) => {
      if (data.targetId !== id) return;
      commitSeqRef.current += 1;
      setLastCommit(`${data.key}:${data.value}:${commitSeqRef.current}`);
    };

    store.bus.on("change", handleChange);
    store.bus.on("state-change", handleStateChange);
    store.bus.on("param-commit", handleCommit);

    return () => {
      store.bus.off("change", handleChange);
      store.bus.off("state-change", handleStateChange);
      store.bus.off("param-commit", handleCommit);
      unregister();
    };
  }, [ctx, ctx?.enabled, id, schema]);

  return { ref, config, previewState, lastCommit };
}

// ── useEditorController ──────────────────────────────────────

export interface EditorController {
  startSelecting: () => void;
  exitEditor: () => void;
  resetAll: () => void;
  exportChanges: () => ChangeSet;
  exportChangesAsText: () => string;
  mode: EditorSessionMode;
  changeCount: number;
}

const NOOP_CONTROLLER: EditorController = {
  startSelecting: () => {},
  exitEditor: () => {},
  resetAll: () => {},
  exportChanges: () => ({ targets: [] }),
  exportChangesAsText: () => "No changes.",
  mode: "idle",
  changeCount: 0,
};

export function useEditorController(): EditorController {
  const ctx = useVibesetContext();
  const [mode, setMode] = useState<EditorSessionMode>("idle");
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    if (!ctx || !ctx.enabled) return;
    const { store } = ctx;

    setMode(store.getMode());
    const handleModeChange = (data: { mode: EditorSessionMode }) => {
      setMode(data.mode);
    };
    store.bus.on("mode-change", handleModeChange);

    const updateChangeCount = () => {
      const cs = store.exportChanges();
      let count = 0;
      for (const t of cs.targets) count += t.changes.length;
      setChangeCount(count);
    };
    updateChangeCount();
    store.bus.on("change", updateChangeCount);

    return () => {
      store.bus.off("mode-change", handleModeChange);
      store.bus.off("change", updateChangeCount);
    };
  }, [ctx, ctx?.enabled]);

  const startSelecting = useCallback(() => ctx?.store.startSelecting(), [ctx]);
  const exitEditor = useCallback(() => ctx?.store.exitEditor(), [ctx]);
  const resetAll = useCallback(() => ctx?.store.store.resetAll(), [ctx]);
  const exportChanges = useCallback(
    (): ChangeSet => ctx?.store.exportChanges() ?? { targets: [] },
    [ctx],
  );
  const exportChangesAsText = useCallback(
    (): string => ctx?.store.exportChangesAsText() ?? "No changes.",
    [ctx],
  );

  if (!ctx || !ctx.enabled) return NOOP_CONTROLLER;

  return { startSelecting, exitEditor, resetAll, exportChanges, exportChangesAsText, mode, changeCount };
}
