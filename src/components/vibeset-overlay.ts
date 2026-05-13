// ── Vibeset UI — OverlayLayer (Lit 3) ───────────────────────
// Selection-mode overlay. Highlights registered targets on hover,
// selects on click. Pure CSS transitions, rAF measurement loop.

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { Vibeset } from "../core/index.js";
import { measure } from "../core/index.js";
import { FONT } from "./theme.js";

// ── constants ───────────────────────────────────────────────

const PAD = 12;
const BLUE = "22, 100, 255";
const BORDER_IDLE = `1.5px dashed rgba(${BLUE}, 0.35)`;
const BORDER_HOVER = `1.5px dashed rgba(${BLUE}, 0.6)`;
const BG_IDLE = `rgba(${BLUE}, 0.04)`;
const BG_HOVER = `rgba(${BLUE}, 0.08)`;
const SHADOW_HOVER = `0 2px 12px rgba(${BLUE}, 0.12)`;
const LABEL_BG = `rgba(${BLUE}, 0.85)`;

interface TargetRect {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

// ── vibeset-overlay ─────────────────────────────────────────

@customElement("vibeset-overlay")
export class VibesetOverlay extends LitElement {
  /* ── public ────────────────────────────────────────────── */

  /** Vibeset instance — set via JS property, not attribute */
  @property({ attribute: false }) store: Vibeset | null = null;

  /* ── internal state ────────────────────────────────────── */

  @state() private _targets: TargetRect[] = [];
  @state() private _hoveredId: string | null = null;

  private _raf = 0;
  private _frameCount = 0;

  /* ── lifecycle ─────────────────────────────────────────── */

  override connectedCallback() {
    super.connectedCallback();
    this._startMeasuring();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._raf);
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has("store")) {
      cancelAnimationFrame(this._raf);
      this._frameCount = 0;
      this._startMeasuring();
    }
  }

  private _startMeasuring() {
    if (!this.store) return;
    const store = this.store;

    const tick = () => {
      this._frameCount++;
      // Throttle: measure every 3rd frame (~20fps)
      if (this._frameCount % 3 === 0) {
        const all = store.registry.getAll();
        const rects: TargetRect[] = [];
        for (const [id, entry] of all) {
          if (!entry.element) continue;
          const bounds = measure(entry.element);
          const er = entry.element.getBoundingClientRect();
          rects.push({
            id,
            label: entry.def.label,
            top: er.top + bounds.top - PAD,
            left: er.left + bounds.left - PAD,
            width: er.width + bounds.right - bounds.left + PAD * 2,
            height: er.height + bounds.bottom - bounds.top + PAD * 2,
          });
        }
        this._targets = rects;
      }
      this._raf = requestAnimationFrame(tick);
    };

    this._raf = requestAnimationFrame(tick);
  }

  /* ── events ────────────────────────────────────────────── */

  private _onSelect(targetId: string) {
    this.dispatchEvent(
      new CustomEvent("vibeset-select", {
        detail: { targetId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /* ── styles ────────────────────────────────────────────── */

  static override styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 99995;
      pointer-events: none;
    }
  `;

  /* ── render ────────────────────────────────────────────── */

  override render() {
    return html`${this._targets.map((t) => {
      const hovered = this._hoveredId === t.id;
      return html`
        <div
          data-motion-overlay=""
          style=${styleMap({
            position: "fixed",
            top: `${t.top}px`,
            left: `${t.left}px`,
            width: `${t.width}px`,
            height: `${t.height}px`,
            border: hovered ? BORDER_HOVER : BORDER_IDLE,
            background: hovered ? BG_HOVER : BG_IDLE,
            boxShadow: hovered ? SHADOW_HOVER : "none",
            borderRadius: "8px",
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "border 150ms, background 150ms, box-shadow 150ms",
          })}
          @click=${() => this._onSelect(t.id)}
          @mouseenter=${() => { this._hoveredId = t.id; }}
          @mouseleave=${() => { this._hoveredId = null; }}
        >
          <div
            data-motion-overlay=""
            style=${styleMap({
              position: "absolute",
              top: "-10px",
              left: "8px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: LABEL_BG,
              color: "#fff",
              fontSize: "11px",
              fontWeight: "600",
              fontFamily: FONT,
              lineHeight: "16px",
              whiteSpace: "nowrap",
              opacity: hovered ? "1" : "0.7",
              transition: "opacity 150ms",
            })}
          >${t.label}</div>
        </div>`;
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibeset-overlay": VibesetOverlay;
  }
}
