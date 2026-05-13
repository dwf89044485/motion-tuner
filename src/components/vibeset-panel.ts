// ── Vibeset UI — Panel (Lit 3 Web Component) ──────────────
// Parameter editing panel. Pure CSS transitions, no animation libs.
// Fixed position, draggable via native mousedown.

import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { classMap } from "lit/directives/class-map.js";
import type { MotionParamDef, MotionStateDef } from "../core/types.js";
import {
  getTokens,
  getStateSelectorTokens,
  FONT,
  type VibesetTheme,
  type ThemeTokens,
} from "./theme.js";

// ── Helpers ───────────────────────────────────────────────────

interface GroupDef {
  label: string;
  params: MotionParamDef[];
  linkedState?: string;
}

// ── Component ─────────────────────────────────────────────────

@customElement("vibeset-panel")
export class VibesetPanel extends LitElement {
  // ── Public properties ──────────────────────────────────────

  @property({ attribute: "target-id", type: String })
  targetId = "";

  @property({ attribute: "target-label", type: String })
  targetLabel = "";

  /** Parameter definitions — set via JS property, not attribute. */
  @property({ attribute: false })
  params: MotionParamDef[] = [];

  /** Current parameter values. */
  @property({ attribute: false })
  config: Record<string, number> = {};

  /** Default parameter values (for reset / diff). */
  @property({ attribute: false })
  defaultConfig: Record<string, number> = {};

  /** Available component states (e.g. hover, active). */
  @property({ attribute: false })
  states: MotionStateDef[] = [];

  @property({ attribute: "active-state", type: String })
  activeState = "";

  @property({ type: String, reflect: true })
  theme: VibesetTheme = "dark";

  @property({ attribute: "show-key-name", type: Boolean })
  showKeyName = true;

  // ── Internal reactive state ─────────────────────────────────

  @state() private _visible = false;
  @state() private _posTop = 20;
  @state() private _posLeft = -1; // -1 = needs initial calc
  @state() private _collapsedGroups: Record<string, boolean> = {};
  @state() private _copyFeedback: "copy" | "reset" | null = null;

  // Drag bookkeeping (non-reactive)
  private _drag: {
    startX: number;
    startY: number;
    startTop: number;
    startLeft: number;
  } | null = null;

  private _boundOnMove = this._onDragMove.bind(this);
  private _boundOnUp = this._onDragUp.bind(this);

  // ── Lifecycle ───────────────────────────────────────────────

  connectedCallback(): void {
    super.connectedCallback();
    // Default left position: right-aligned
    if (this._posLeft < 0) {
      this._posLeft = window.innerWidth - 320;
    }
  }

  protected firstUpdated(): void {
    // Entrance animation
    requestAnimationFrame(() => {
      this._visible = true;
    });
  }

  protected willUpdate(changed: PropertyValues): void {
    // Rebuild collapsed groups when params change
    if (changed.has("params")) {
      this._initCollapsedGroups();
    }
    // Auto-expand linked group when activeState changes
    if (changed.has("activeState") && this.activeState) {
      const groups = this._buildGroups();
      const match = groups.find((g) => g.linkedState === this.activeState);
      if (match) {
        const next: Record<string, boolean> = {};
        for (const key of Object.keys(this._collapsedGroups)) next[key] = true;
        next[match.label] = false;
        this._collapsedGroups = next;
      }
    }
  }

  // ── Accordion init ──────────────────────────────────────────

  private _initCollapsedGroups(): void {
    const init: Record<string, boolean> = {};
    for (const p of this.params) {
      if (!(p.group in init)) init[p.group] = true;
    }
    if ("基础" in init) {
      init["基础"] = false;
    } else {
      const first = Object.keys(init)[0];
      if (first) init[first] = false;
    }
    this._collapsedGroups = init;
  }

  // ── Group building ──────────────────────────────────────────

  private _buildGroups(): GroupDef[] {
    const result: GroupDef[] = [];
    const map = new Map<string, MotionParamDef[]>();
    for (const p of this.params) {
      if (p.states && this.activeState && !p.states.includes(this.activeState))
        continue;
      let arr = map.get(p.group);
      if (!arr) {
        arr = [];
        map.set(p.group, arr);
        result.push({ label: p.group, params: arr, linkedState: p.linkedState });
      }
      arr.push(p);
    }
    return result;
  }

  // ── Drag ────────────────────────────────────────────────────

  private _onDragStart(e: MouseEvent): void {
    // Don't drag when clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    this._drag = {
      startX: e.clientX,
      startY: e.clientY,
      startTop: this._posTop,
      startLeft: this._posLeft,
    };
    document.addEventListener("mousemove", this._boundOnMove);
    document.addEventListener("mouseup", this._boundOnUp);
  }

  private _onDragMove(e: MouseEvent): void {
    if (!this._drag) return;
    this._posTop = this._drag.startTop + (e.clientY - this._drag.startY);
    this._posLeft = this._drag.startLeft + (e.clientX - this._drag.startX);
  }

  private _onDragUp(): void {
    this._drag = null;
    document.removeEventListener("mousemove", this._boundOnMove);
    document.removeEventListener("mouseup", this._boundOnUp);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("mousemove", this._boundOnMove);
    document.removeEventListener("mouseup", this._boundOnUp);
  }

  // ── Toggle group ────────────────────────────────────────────

  private _toggleGroup(label: string, linkedState?: string): void {
    const isCollapsed = this._collapsedGroups[label] ?? true;
    if (isCollapsed) {
      // Accordion: expand this, collapse others
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(this._collapsedGroups)) next[key] = true;
      next[label] = false;
      this._collapsedGroups = next;
    } else {
      this._collapsedGroups = { ...this._collapsedGroups, [label]: true };
    }
    // LinkedState: auto-switch on expand
    if (isCollapsed && linkedState) {
      this._fire("vibeset-state-change", { state: linkedState });
    }
  }

  // ── Parameter change handlers ───────────────────────────────

  private _onSliderChange(key: string, value: number): void {
    this._fire("vibeset-change", { key, value });
  }

  private _onSliderCommit(key: string, value: number): void {
    this._fire("vibeset-commit", { key, value });
  }

  private _onResetParam(key: string): void {
    this._fire("vibeset-reset", { key });
    this._fire("vibeset-change", { key, value: this.defaultConfig[key] });
  }

  private _onResetAll(): void {
    if (!this._hasAnyChange) return;
    for (const p of this.params) {
      if (this.config[p.key] !== this.defaultConfig[p.key]) {
        this._fire("vibeset-change", { key: p.key, value: this.defaultConfig[p.key] });
        this._fire("vibeset-commit", { key: p.key, value: this.defaultConfig[p.key] });
      }
    }
    this._copyFeedback = "reset";
    setTimeout(() => {
      this._copyFeedback = null;
    }, 1500);
  }

  private _onClose(): void {
    this.dispatchEvent(new Event("vibeset-close", { bubbles: true, composed: true }));
  }

  // ── Copy code ───────────────────────────────────────────────

  private get _hasAnyChange(): boolean {
    return this.params.some((p) => this.config[p.key] !== this.defaultConfig[p.key]);
  }

  private _onCopy(): void {
    if (!this._hasAnyChange) return;
    const changed = this.params.filter(
      (p) => this.config[p.key] !== this.defaultConfig[p.key],
    );
    const idLine = this.targetId ? ` (id: "${this.targetId}")` : "";
    const lines = changed.map((p) => {
      const oldV = this.defaultConfig[p.key];
      const newV = this.config[p.key];
      return `  ${p.key}: ${newV},  // ${p.label} · was ${oldV}`;
    });
    const text =
      `// vibeset: ${changed.length} change(s) for "${this.targetLabel}"${idLine}\n` +
      `// Apply to defaultConfig (find the MotionTargetDef whose id matches above):\n` +
      `{\n${lines.join("\n")}\n}\n`;

    navigator.clipboard.writeText(text);
    this._fire("vibeset-copy", { text });
    this._copyFeedback = "copy";
    setTimeout(() => {
      this._copyFeedback = null;
    }, 1500);
  }

  // ── Event helper ────────────────────────────────────────────

  private _fire<T>(name: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  // ── Static styles (structural, theme-independent) ───────────

  static override styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: 99998;
      width: 300px;
      border-radius: 12px;
      overflow: hidden;
      pointer-events: auto;
    }

    :host([hidden]) {
      display: none;
    }

    /* ── Entrance transition ── */
    .panel {
      border-radius: 12px;
      overflow: hidden;
      opacity: 0;
      transform: scale(0.6) translateY(40px);
      transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .panel.visible {
      opacity: 1;
      transform: scale(1) translateY(0);
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      user-select: none;
      cursor: grab;
    }
    .header-label {
      font-size: 13px;
      font-weight: 600;
    }

    /* ── Close button ── */
    .close-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-radius: 4px;
      transition: color 100ms, background 100ms;
    }

    /* ── State selector ── */
    .state-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
    }
    .state-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .state-container {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px;
      border-radius: 40px;
      width: 100%;
      box-sizing: border-box;
    }
    .state-btn {
      flex: 1;
      min-width: 0;
      border: none;
      border-radius: 40px;
      padding: 4px 10px;
      font-size: 12px;
      line-height: 20px;
      cursor: pointer;
      white-space: nowrap;
      text-align: center;
      transition: background-color 150ms, color 150ms;
    }

    /* ── Scroll body ── */
    .scroll-body {
      max-height: 60vh;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* ── Group toggle button ── */
    .group-toggle {
      width: 100%;
      padding: 7px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: background 100ms;
    }
    .group-toggle:hover {
      /* hover bg set via inline style for theming */
    }
    .group-arrow {
      display: inline-block;
      transition: transform 200ms;
      font-size: 9px;
    }
    .group-arrow.expanded {
      transform: rotate(90deg);
    }
    .group-count {
      font-size: 9px;
      font-weight: 400;
    }

    /* ── Accordion body ── */
    .group-body {
      overflow: hidden;
      transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .group-body.collapsed {
      max-height: 0;
      opacity: 0;
    }
    .group-body.expanded {
      max-height: 1000px;
      opacity: 1;
    }

    .group-params {
      padding: 2px 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .group-params.single-group {
      padding: 6px 12px 10px;
    }

    /* ── Divider before param ── */
    .param-divider {
      padding-top: 10px;
      margin-top: 4px;
    }

    /* ── Footer ── */
    .footer {
      padding: 10px 12px 12px;
    }
    .footer-info {
      font-size: 10px;
      margin-bottom: 6px;
    }
    .footer-buttons {
      display: flex;
      gap: 6px;
    }
    .footer-btn {
      flex: 1;
      height: 28px;
      border-radius: 8px;
      background: transparent;
      font-size: 11px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 100ms;
      cursor: pointer;
    }
    .footer-btn.disabled {
      cursor: default;
    }
  `;

  // ── Render ──────────────────────────────────────────────────

  protected override render() {
    const tokens = getTokens(this.theme);
    const stateTokens = getStateSelectorTokens(this.theme);
    const isDark = this.theme === "dark";
    const groups = this._buildGroups();
    const singleGroup = groups.length === 1;

    // Host positioning
    this.style.top = `${this._posTop}px`;
    this.style.left = `${this._posLeft}px`;

    const panelStyles = {
      backgroundColor: tokens.panelBg,
      backdropFilter: "blur(13px) saturate(90%)",
      WebkitBackdropFilter: "blur(13px) saturate(90%)",
      border: `1px solid ${tokens.panelBorder}`,
      boxShadow: tokens.panelShadow,
      fontFamily: FONT,
    };

    const borderDivider = `1px solid ${tokens.divider}`;
    const btnBorder = `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`;
    const btnHoverBg = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)";

    return html`
      <div
        class=${classMap({ panel: true, visible: this._visible })}
        style=${styleMap(panelStyles)}
      >
        <!-- ── Header (draggable) ── -->
        <div
          class="header"
          style=${styleMap({ borderBottom: borderDivider })}
          @mousedown=${this._onDragStart}
        >
          <span class="header-label" style="color:${tokens.textPrimary}">
            ${this.targetLabel}
          </span>
          <button
            class="close-btn"
            style="color:${tokens.textTertiary}"
            @click=${this._onClose}
            @mouseenter=${(e: MouseEvent) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = tokens.buttonTextHover;
              el.style.background = tokens.buttonBg;
            }}
            @mouseleave=${(e: MouseEvent) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = tokens.textTertiary;
              el.style.background = "transparent";
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- ── State selector ── -->
        ${this.states.length > 0 && this.activeState !== undefined
          ? html`
              <div
                class="state-section"
                style=${styleMap({ borderBottom: borderDivider })}
              >
                <span class="state-label" style="color:${tokens.textTertiary}">
                  组件状态
                </span>
                <div
                  class="state-container"
                  style=${styleMap({
                    background: stateTokens.containerBg,
                    border: stateTokens.containerBorder,
                  })}
                >
                  ${repeat(
                    this.states,
                    (opt) => opt.value,
                    (opt) => {
                      const active = opt.value === this.activeState;
                      return html`
                        <button
                          class="state-btn"
                          style=${styleMap({
                            fontWeight: active ? "600" : "400",
                            color: active
                              ? stateTokens.itemActiveText
                              : stateTokens.itemBaseText,
                            background: active
                              ? stateTokens.itemActiveBg
                              : stateTokens.itemBaseBg,
                            fontFamily: FONT,
                          })}
                          @click=${() =>
                            this._fire("vibeset-state-change", {
                              state: opt.value,
                            })}
                        >
                          ${opt.label}
                        </button>
                      `;
                    },
                  )}
                </div>
              </div>
            `
          : nothing}

        <!-- ── Parameter groups ── -->
        <div class="scroll-body">
          ${repeat(
            groups,
            (g) => g.label,
            (group) => {
              const isCollapsed = singleGroup
                ? false
                : (this._collapsedGroups[group.label] ?? true);

              return html`
                <div
                  style=${styleMap({
                    borderBottom: singleGroup
                      ? "none"
                      : `1px solid ${tokens.dividerSoft}`,
                  })}
                >
                  ${!singleGroup
                    ? html`
                        <button
                          class="group-toggle"
                          style="color:${tokens.textTertiary};font-family:${FONT}"
                          @click=${() =>
                            this._toggleGroup(group.label, group.linkedState)}
                          @mouseenter=${(e: MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.background =
                              tokens.dividerSoft;
                          }}
                          @mouseleave=${(e: MouseEvent) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "transparent";
                          }}
                        >
                          <span
                            class=${classMap({
                              "group-arrow": true,
                              expanded: !isCollapsed,
                            })}
                            >&#9654;</span
                          >
                          <span>${group.label}</span>
                          <span
                            class="group-count"
                            style="color:${tokens.textMuted}"
                            >${group.params.length}</span
                          >
                        </button>
                      `
                    : nothing}

                  <div
                    class=${classMap({
                      "group-body": true,
                      collapsed: isCollapsed,
                      expanded: !isCollapsed,
                    })}
                  >
                    <div
                      class=${classMap({
                        "group-params": true,
                        "single-group": singleGroup,
                      })}
                    >
                      ${group.params.map((param) =>
                        this._renderParam(param, tokens),
                      )}
                    </div>
                  </div>
                </div>
              `;
            },
          )}
        </div>

        <!-- ── Footer ── -->
        <div
          class="footer"
          style=${styleMap({ borderTop: borderDivider })}
        >
          <div class="footer-info" style="color:${tokens.textMuted}">
            ${this._hasAnyChange
              ? `${this.params.filter((p) => this.config[p.key] !== this.defaultConfig[p.key]).length} changes`
              : "No changes"}
          </div>
          <div class="footer-buttons">
            <button
              class=${classMap({
                "footer-btn": true,
                disabled: !this._hasAnyChange,
              })}
              style=${styleMap({
                border: btnBorder,
                color: this._hasAnyChange
                  ? tokens.textSecondary
                  : tokens.textMuted,
                fontFamily: FONT,
              })}
              @click=${this._onResetAll}
              @mouseenter=${(e: MouseEvent) => {
                if (this._hasAnyChange)
                  (e.currentTarget as HTMLElement).style.background =
                    btnHoverBg;
              }}
              @mouseleave=${(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              ${this._copyFeedback === "reset" ? "✓ 已重置" : "重置"}
            </button>
            <button
              class=${classMap({
                "footer-btn": true,
                disabled: !this._hasAnyChange,
              })}
              style=${styleMap({
                border: btnBorder,
                color: this._hasAnyChange
                  ? tokens.textSecondary
                  : tokens.textMuted,
                fontFamily: FONT,
              })}
              @click=${this._onCopy}
              @mouseenter=${(e: MouseEvent) => {
                if (this._hasAnyChange)
                  (e.currentTarget as HTMLElement).style.background =
                    btnHoverBg;
              }}
              @mouseleave=${(e: MouseEvent) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              ${this._copyFeedback === "copy" ? "✓ 已复制" : "复制代码"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Render single param ─────────────────────────────────────

  private _renderParam(param: MotionParamDef, tokens: ThemeTokens) {
    const value = this.config[param.key] ?? this.defaultConfig[param.key] ?? 0;
    const defaultValue = this.defaultConfig[param.key] ?? 0;
    const isChanged = value !== defaultValue;

    // Skip XY pair secondaries (rendered by the primary with pairKey)
    // XY pads are not supported in Lit version — render as individual sliders
    // (vibeset-slider handles slider rendering)

    return html`
      ${param.dividerBefore
        ? html`<div
            class="param-divider"
            style="border-top:1px solid ${tokens.dividerStrong}"
          ></div>`
        : nothing}
      <vibeset-slider
        param-key=${param.key}
        label=${param.label}
        key-name=${param.key}
        .value=${value}
        .defaultValue=${defaultValue}
        .min=${param.min}
        .max=${param.max}
        .step=${param.step}
        ?show-key-name=${this.showKeyName}
        theme=${this.theme}
        @vibeset-slider-change=${(e: CustomEvent<{ key: string; value: number }>) => {
          this._onSliderChange(e.detail.key, e.detail.value);
        }}
        @vibeset-slider-commit=${(e: CustomEvent<{ key: string; value: number }>) => {
          this._onSliderCommit(e.detail.key, e.detail.value);
        }}
        @vibeset-slider-reset=${(e: CustomEvent<{ key: string }>) => {
          this._onResetParam(e.detail.key);
        }}
      ></vibeset-slider>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibeset-panel": VibesetPanel;
  }
}
