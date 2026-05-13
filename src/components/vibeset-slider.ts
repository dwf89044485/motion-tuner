// ── Vibeset UI — Slider (Lit 3) ─────────────────────────────
// Rewritten from React. Native <input type="range"> with custom CSS.
// Shadow DOM open, inline styles matching the original.

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";
import type { ThemeTokens } from "./theme.js";
import { getTokens, MONO_FONT } from "./theme.js";

// ── helpers ─────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ── vibeset-slider ──────────────────────────────────────────

@customElement("vibeset-slider")
export class VibesetSlider extends LitElement {
  /* ── public reactive properties (attribute-mapped) ─────── */

  @property({ attribute: "param-key" }) paramKey = "";
  @property() label = "";
  @property({ attribute: "key-name" }) keyName = "";
  @property({ type: Number }) value = 0;
  @property({ attribute: "default-value", type: Number }) defaultValue = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 1;
  @property({ type: Number }) step = 0.01;
  @property() theme: "dark" | "light" = "dark";
  @property({ attribute: "show-key-name", type: Boolean }) showKeyName = true;

  /* ── internal state ────────────────────────────────────── */

  @state() private _editing = false;
  @state() private _draft = "";

  @query(".ev-input") private _inputEl!: HTMLInputElement | null;

  /* ── derived ───────────────────────────────────────────── */

  private get _tokens(): ThemeTokens {
    return getTokens(this.theme);
  }

  private get _isDark(): boolean {
    return this.theme === "dark";
  }

  private get _decimals(): number {
    return this.step < 1 ? 2 : 0;
  }

  private get _isDefault(): boolean {
    return this.value === this.defaultValue;
  }

  private get _pct(): number {
    return ((this.value - this.min) / (this.max - this.min)) * 100;
  }

  /* ── events ────────────────────────────────────────────── */

  private _fireChange(value: number) {
    this.dispatchEvent(
      new CustomEvent("vibeset-change", {
        detail: { key: this.paramKey, value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _fireCommit(value: number) {
    this.dispatchEvent(
      new CustomEvent("vibeset-commit", {
        detail: { key: this.paramKey, value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _clampRound(raw: number): number {
    const clamped = clamp(raw, this.min, this.max);
    return parseFloat(clamped.toFixed(this._decimals));
  }

  private _clampAndSet(raw: number) {
    const v = this._clampRound(raw);
    this._fireChange(v);
    this._fireCommit(v);
  }

  /* ── StepButton logic ──────────────────────────────────── */

  private _renderStepButton(direction: "minus" | "plus") {
    const dk = this._isDark;
    const baseColor = dk ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.40)";
    const baseBg = dk ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)";
    const hoverColor = dk ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.7)";
    const hoverBg = dk ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";

    return html`
      <button
        aria-label=${direction === "minus" ? "减少" : "增加"}
        style=${styleMap({
          width: "16px",
          height: "16px",
          border: dk
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(0,0,0,0.10)",
          background: baseBg,
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          flexShrink: "0",
          fontSize: "12px",
          lineHeight: "1",
          fontWeight: "600",
          color: baseColor,
          transition: "all 100ms",
          fontFamily: MONO_FONT,
        })}
        @click=${() =>
          this._clampAndSet(
            this.value + (direction === "minus" ? -this.step : this.step),
          )}
        @mouseenter=${(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = hoverColor;
          el.style.background = hoverBg;
        }}
        @mouseleave=${(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = baseColor;
          el.style.background = baseBg;
        }}
      >
        ${direction === "minus" ? "\u2212" : "+"}
      </button>
    `;
  }

  /* ── EditableValue logic ───────────────────────────────── */

  private _startEdit() {
    this._draft = this.value.toFixed(this._decimals);
    this._editing = true;
    this.updateComplete.then(() => {
      this._inputEl?.select();
    });
  }

  private _commitEdit() {
    this._editing = false;
    const parsed = parseFloat(this._draft);
    if (!isNaN(parsed)) this._clampAndSet(parsed);
  }

  private _onEditKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this._commitEdit();
      return;
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      this._editing = false;
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const parsed = parseFloat(this._draft);
      if (isNaN(parsed)) return;
      const s = e.shiftKey ? this.step * 10 : this.step;
      const delta = e.key === "ArrowUp" ? s : -s;
      const next = this._clampRound(parsed + delta);
      this._draft = next.toFixed(this._decimals);
      this._fireChange(next);
      this._fireCommit(next);
    }
  }

  private _onValueDragStart(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startVal = this.value;
    const step = this.step;
    const min = this.min;
    const max = this.max;
    const decimals = this._decimals;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const s = ev.shiftKey ? step * 0.1 : step;
      const next = clamp(
        startVal + Math.round(dx * s * 10) / 10,
        min,
        max,
      );
      const rounded = parseFloat(next.toFixed(decimals));
      this._fireChange(rounded);
      this._fireCommit(rounded);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  private _renderEditableValue() {
    const dk = this._isDark;
    const tokens = this._tokens;

    if (this._editing) {
      return html`
        <input
          class="ev-input"
          .value=${this._draft}
          @input=${(e: InputEvent) => {
            this._draft = (e.target as HTMLInputElement).value;
          }}
          @blur=${() => this._commitEdit()}
          @keydown=${(e: KeyboardEvent) => this._onEditKeyDown(e)}
          style=${styleMap({
            width: "38px",
            height: "16px",
            fontSize: "11px",
            fontWeight: "500",
            fontFamily: MONO_FONT,
            textAlign: "center",
            border: dk
              ? "1px solid rgba(255,255,255,0.28)"
              : "1px solid rgba(0,0,0,0.18)",
            borderRadius: "3px",
            outline: "none",
            background: dk ? "rgba(15,18,24,0.95)" : "#fff",
            color: dk ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)",
            padding: "0 2px",
          })}
        />
      `;
    }

    const valColor = this._isDefault
      ? dk
        ? "rgba(255,255,255,0.42)"
        : "rgba(0,0,0,0.4)"
      : dk
        ? "rgba(255,255,255,0.85)"
        : "rgba(0,0,0,0.7)";

    return html`
      <span
        title="点击编辑数值，或左右拖动调整"
        style=${styleMap({
          fontSize: "11px",
          fontWeight: "500",
          color: valColor,
          fontFamily: MONO_FONT,
          minWidth: "32px",
          textAlign: "center",
          transition: "color 100ms",
          cursor: "ew-resize",
          borderRadius: "3px",
          padding: "0 2px",
          userSelect: "none",
        })}
        @click=${() => this._startEdit()}
        @mousedown=${(e: MouseEvent) => this._onValueDragStart(e)}
        @mouseenter=${(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.background = dk
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)";
        }}
        @mouseleave=${(e: MouseEvent) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        ${this.value.toFixed(this._decimals)}
      </span>
    `;
  }

  /* ── Reset button ──────────────────────────────────────── */

  private _renderResetButton() {
    if (this._isDefault) return nothing;
    const t = this._tokens;

    return html`
      <button
        title="Reset to default"
        style=${styleMap({
          width: "18px",
          height: "18px",
          border: "none",
          background: t.buttonBg,
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: t.buttonText,
          transition: "all 100ms",
          padding: "0",
          flexShrink: "0",
        })}
        @click=${() => this._clampAndSet(this.defaultValue)}
        @mouseenter=${(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = t.buttonTextHover;
          el.style.background = t.buttonBgHover;
        }}
        @mouseleave=${(e: MouseEvent) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = t.buttonText;
          el.style.background = t.buttonBg;
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    `;
  }

  /* ── styles ────────────────────────────────────────────── */

  static override styles = css`
    :host {
      display: block;
    }

    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      margin: 6px 0;
      padding: 0;
      border: none;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      vertical-align: middle;
    }

    input[type="range"]::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 2px;
      background: transparent;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 8px;
      height: 16px;
      margin-top: -6px;
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 120ms, box-shadow 120ms, transform 120ms;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scaleX(1.15);
    }

    input[type="range"]::-webkit-slider-thumb:active {
      transform: scaleY(0.9);
    }

    input[type="range"]::-moz-range-track {
      height: 4px;
      border: none;
      border-radius: 2px;
    }

    input[type="range"]::-moz-range-progress {
      height: 4px;
      border-radius: 2px;
    }

    input[type="range"]::-moz-range-thumb {
      width: 8px;
      height: 16px;
      border-radius: 4px;
      cursor: pointer;
    }
  `;

  /* ── render ────────────────────────────────────────────── */

  override render() {
    const t = this._tokens;
    const pct = this._pct;

    // Dynamic thumb/track styles must be inline because they depend on token values
    const thumbStyle = `
      background: ${t.sliderThumbBg};
      border: 1.5px solid ${t.sliderThumbBorder};
      box-shadow: ${t.sliderThumbShadow};
    `;
    const thumbHoverStyle = `
      border-color: ${t.sliderThumbBorderHover};
      box-shadow: ${t.sliderThumbShadowHover};
    `;
    const thumbActiveStyle = `
      border-color: ${t.sliderThumbBorderActive};
    `;

    return html`
      <style>
        input[type="range"]::-webkit-slider-thumb {
          ${thumbStyle}
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          ${thumbHoverStyle}
        }
        input[type="range"]::-webkit-slider-thumb:active {
          ${thumbActiveStyle}
        }
        input[type="range"]::-moz-range-track {
          background: ${t.sliderTrack};
        }
        input[type="range"]::-moz-range-progress {
          background: ${t.sliderProgress};
        }
        input[type="range"]::-moz-range-thumb {
          background: ${t.sliderThumbBg};
          border: 1.5px solid ${t.sliderThumbBorder};
          box-shadow: ${t.sliderThumbShadow};
        }
      </style>

      <div style="display:flex;flex-direction:column;gap:3px">
        <!-- label row -->
        <div
          style="display:flex;justify-content:space-between;align-items:center"
        >
          <label
            style=${styleMap({
              fontSize: "12px",
              fontWeight: "500",
              color: t.textSecondary,
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            })}
          >
            ${this.label}
            ${this.showKeyName
              ? html`<span
                  style=${styleMap({
                    fontSize: "9px",
                    fontWeight: "400",
                    color: t.textMuted,
                    fontFamily: MONO_FONT,
                  })}
                  >${this.keyName}</span
                >`
              : nothing}
          </label>
          <div style="display:flex;align-items:center;gap:3px">
            ${this._renderResetButton()}
            ${this._renderStepButton("minus")}
            ${this._renderEditableValue()}
            ${this._renderStepButton("plus")}
          </div>
        </div>

        <!-- range input -->
        <input
          type="range"
          .min=${String(this.min)}
          .max=${String(this.max)}
          .step=${String(this.step)}
          .value=${String(this.value)}
          style="background:linear-gradient(to right,${t.sliderProgress} 0%,${t.sliderProgress} ${pct}%,${t.sliderTrack} ${pct}%,${t.sliderTrack} 100%)"
          @input=${(e: InputEvent) => {
            this._fireChange(
              parseFloat((e.target as HTMLInputElement).value),
            );
          }}
          @mouseup=${(e: MouseEvent) => {
            this._fireCommit(
              parseFloat((e.currentTarget as HTMLInputElement).value),
            );
          }}
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibeset-slider": VibesetSlider;
  }
}
