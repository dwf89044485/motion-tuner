// ── Vibeset UI — XY Pad (Lit 3) ─────────────────────────────
// Rewritten from React. 2D drag control using pointer capture.
// Shadow DOM open, inline styles matching the original.

import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { ThemeTokens } from "./theme.js";
import { getTokens, MONO_FONT } from "./theme.js";

// ── helpers ─────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ── vibeset-xy-pad ──────────────────────────────────────────

@customElement("vibeset-xy-pad")
export class VibesetXYPad extends LitElement {
  /* ── public reactive properties (attribute-mapped) ─────── */

  @property({ attribute: "value-x", type: Number }) valueX = 0;
  @property({ attribute: "value-y", type: Number }) valueY = 0;
  @property({ attribute: "min-x", type: Number }) minX = 0;
  @property({ attribute: "max-x", type: Number }) maxX = 1;
  @property({ attribute: "min-y", type: Number }) minY = 0;
  @property({ attribute: "max-y", type: Number }) maxY = 1;
  @property({ attribute: "label-x" }) labelX = "";
  @property({ attribute: "label-y" }) labelY = "";
  @property() theme: "dark" | "light" = "dark";

  /* ── derived ───────────────────────────────────────────── */

  private get _tokens(): ThemeTokens {
    return getTokens(this.theme);
  }

  private get _isDark(): boolean {
    return this.theme === "dark";
  }

  private get _xPct(): number {
    return ((this.valueX - this.minX) / (this.maxX - this.minX)) * 100;
  }

  private get _yPct(): number {
    return ((this.valueY - this.minY) / (this.maxY - this.minY)) * 100;
  }

  /* ── events ────────────────────────────────────────────── */

  private _fireChange(x: number, y: number) {
    this.dispatchEvent(
      new CustomEvent("vibeset-change", {
        detail: { x, y },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /* ── pointer interaction ───────────────────────────────── */

  private _updateFromPointer(
    clientX: number,
    clientY: number,
    el: HTMLElement,
  ): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    const xRatio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const yRatio = clamp((clientY - rect.top) / rect.height, 0, 1);
    const nextX = parseFloat(
      clamp(this.minX + xRatio * (this.maxX - this.minX), this.minX, this.maxX).toFixed(2),
    );
    const nextY = parseFloat(
      clamp(this.minY + yRatio * (this.maxY - this.minY), this.minY, this.maxY).toFixed(2),
    );
    this._fireChange(nextX, nextY);
    return { x: nextX, y: nextY };
  }

  private _onPointerDown(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    this._updateFromPointer(e.clientX, e.clientY, el);

    el.setPointerCapture(e.pointerId);

    const handleMove = (ev: PointerEvent) => {
      this._updateFromPointer(ev.clientX, ev.clientY, el);
    };

    const handleUp = (ev: PointerEvent) => {
      if (el.hasPointerCapture(ev.pointerId)) {
        el.releasePointerCapture(ev.pointerId);
      }
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleUp);
    };

    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);
  }

  /* ── styles ────────────────────────────────────────────── */

  static override styles = css`
    :host {
      display: block;
    }
  `;

  /* ── render ────────────────────────────────────────────── */

  override render() {
    const t = this._tokens;
    const dk = this._isDark;
    const xPct = this._xPct;
    const yPct = this._yPct;

    return html`
      <div style="display:flex;flex-direction:column;gap:8px">
        <!-- header row -->
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
            ${this.labelX && this.labelY
              ? `${this.labelX} / ${this.labelY}`
              : this.labelX || this.labelY}
            <span
              style=${styleMap({
                fontSize: "9px",
                fontWeight: "400",
                color: t.textMuted,
                fontFamily: MONO_FONT,
              })}
              >${this.labelX}/${this.labelY}</span
            >
          </label>
          <span
            style=${styleMap({
              fontSize: "11px",
              fontWeight: "500",
              color: t.textPrimary,
              fontFamily: MONO_FONT,
              minWidth: "62px",
              textAlign: "right",
            })}
          >
            ${this.valueX.toFixed(2)}, ${this.valueY.toFixed(2)}
          </span>
        </div>

        <!-- pad area -->
        <div
          @pointerdown=${this._onPointerDown}
          style=${styleMap({
            width: "100%",
            aspectRatio: "1 / 1",
            position: "relative",
            borderRadius: "12px",
            border: dk
              ? "1px solid rgba(255,255,255,0.18)"
              : "1px solid rgba(0,0,0,0.12)",
            backgroundColor: dk
              ? "rgba(255,255,255,0.04)"
              : "rgba(0,0,0,0.02)",
            backgroundImage: dk
              ? "radial-gradient(circle at center, rgba(255,255,255,0.16) 1px, transparent 1.5px)"
              : "radial-gradient(circle at center, rgba(0,0,0,0.15) 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            overflow: "hidden",
            touchAction: "none",
            cursor: "crosshair",
          })}
        >
          <!-- vertical crosshair -->
          <div
            style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(22,100,255,0.35);transform:translateX(-0.5px)"
          ></div>
          <!-- horizontal crosshair -->
          <div
            style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(22,100,255,0.35);transform:translateY(-0.5px)"
          ></div>
          <!-- dot -->
          <div
            style=${styleMap({
              position: "absolute",
              left: `${xPct}%`,
              top: `${yPct}%`,
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#22D3EE",
              boxShadow: dk
                ? "0 0 0 3px rgba(34,211,238,0.24), 0 2px 8px rgba(0,0,0,0.48)"
                : "0 0 0 3px rgba(34,211,238,0.18), 0 2px 6px rgba(0,0,0,0.2)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            })}
          ></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibeset-xy-pad": VibesetXYPad;
  }
}
