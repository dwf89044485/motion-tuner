// ── Vibeset Editor — Lit Web Component (orchestrator) ────────
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Vibeset, EditorSessionMode, RegistryEntry } from "../core/index.js";

// Import sibling components so they auto-register
import "./vibeset-launcher.js";
import "./vibeset-overlay.js";
import "./vibeset-panel.js";

@customElement("vibeset-editor")
export class VibesetEditor extends LitElement {
  @property({ reflect: true }) theme: "dark" | "light" = "dark";
  @property({ type: Boolean, attribute: "show-key-name" }) showKeyName = false;

  /** Injected from outside (e.g. React binding sets this as a JS property) */
  @property({ attribute: false }) store: Vibeset | null = null;

  @state() private _mode: EditorSessionMode = "idle";
  @state() private _changeCount = 0;
  @state() private _activeId: string | null = null;
  @state() private _activeEntry: RegistryEntry | null = null;
  @state() private _config: Record<string, number> = {};
  @state() private _previewState: string | null = null;
  @state() private _rev = 0; // bump to force re-read from store

  private _unsubs: (() => void)[] = [];

  static styles = css`
    :host { display: contents; }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this._onEscape);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this._onEscape);
    this._cleanup();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("store")) {
      this._cleanup();
      this._subscribe();
    }
  }

  private _subscribe() {
    const s = this.store;
    if (!s) return;

    this._mode = s.getMode();

    const onMode = (d: { mode: EditorSessionMode }) => {
      this._mode = d.mode;
      this._syncActive();
    };
    const onChange = () => {
      this._rev++;
      this._syncActive();
      this._updateChangeCount();
    };
    const onState = () => { this._rev++; this._syncActive(); };

    s.bus.on("mode-change", onMode);
    s.bus.on("change", onChange);
    s.bus.on("state-change", onState);
    s.bus.on("target-registered", onChange);
    s.bus.on("target-unregistered", onChange);

    this._unsubs = [
      () => s.bus.off("mode-change", onMode),
      () => s.bus.off("change", onChange),
      () => s.bus.off("state-change", onState),
      () => s.bus.off("target-registered", onChange),
      () => s.bus.off("target-unregistered", onChange),
    ];
  }

  private _cleanup() {
    for (const fn of this._unsubs) fn();
    this._unsubs = [];
  }

  private _syncActive() {
    const s = this.store;
    if (!s) return;
    const id = s.registry.getActiveTarget();
    this._activeId = id;
    this._activeEntry = id ? s.registry.get(id) ?? null : null;
    if (id) {
      this._config = { ...s.store.getConfig(id) };
      this._previewState = s.store.getPreviewState(id) ?? this._activeEntry?.def.defaultState ?? null;
    }
  }

  private _updateChangeCount() {
    if (!this.store) return;
    const cs = this.store.exportChanges();
    let c = 0;
    for (const t of cs.targets) c += t.changes.length;
    this._changeCount = c;
  }

  private _onEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.store) this.store.exitEditor();
  };

  render() {
    if (!this.store) return nothing;
    const s = this.store;

    return html`
      ${this._mode === "selecting" ? html`
        <vibeset-overlay
          .store=${s}
          @vibeset-select=${(e: CustomEvent) => { s.selectTarget(e.detail.targetId); }}
        ></vibeset-overlay>
      ` : nothing}

      ${this._mode === "editing" && this._activeEntry ? html`
        <vibeset-panel
          target-id=${this._activeId}
          target-label=${this._activeEntry.def.label}
          .params=${this._activeEntry.def.schema}
          .config=${this._config}
          .defaultConfig=${this._activeEntry.def.defaultConfig}
          .states=${this._activeEntry.def.states ?? []}
          active-state=${this._previewState ?? ""}
          theme=${this.theme}
          ?show-key-name=${this.showKeyName}
          @vibeset-change=${(e: CustomEvent) => {
            if (this._activeId) s.store.setParam(this._activeId, e.detail.key, e.detail.value);
          }}
          @vibeset-commit=${(e: CustomEvent) => {
            if (this._activeId) s.bus.emit("param-commit", { targetId: this._activeId, key: e.detail.key, value: e.detail.value });
          }}
          @vibeset-reset=${(e: CustomEvent) => {
            if (this._activeId) {
              const def = this._activeEntry!.def.defaultConfig[e.detail.key];
              if (def !== undefined) s.store.setParam(this._activeId, e.detail.key, def);
            }
          }}
          @vibeset-state-change=${(e: CustomEvent) => {
            if (this._activeId) s.store.setPreviewState(this._activeId, e.detail.state);
          }}
          @vibeset-close=${() => s.exitEditor()}
        ></vibeset-panel>
      ` : nothing}

      <vibeset-launcher
        theme=${this.theme}
        mode=${this._mode}
        change-count=${this._changeCount}
        @vibeset-start-selecting=${() => s.startSelecting()}
        @vibeset-exit-editor=${() => s.exitEditor()}
        @vibeset-reselect=${() => { s.exitEditor(); s.startSelecting(); }}
        @vibeset-copy-changes=${() => { navigator.clipboard.writeText(s.exportChangesAsText()); }}
        @vibeset-reset-all=${() => s.store.resetAll()}
      ></vibeset-launcher>
    `;
  }
}
