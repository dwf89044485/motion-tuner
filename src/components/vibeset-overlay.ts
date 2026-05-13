// ── Vibeset Overlay — Lit Web Component ──────────────────────
import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { measure } from "../core/measure.js";
import type { Vibeset } from "../core/index.js";
import { FONT } from "./theme.js";

const PAD = 12;
const BLUE = "22, 100, 255";

interface TargetRect {
  id: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

@customElement("vibeset-overlay")
export class VibesetOverlay extends LitElement {
  @property({ attribute: false }) store: Vibeset | null = null;

  @state() private _targets: TargetRect[] = [];
  @state() private _hoveredId: string | null = null;

  private _raf = 0;
  private _frameCount = 0;

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 99995;
      pointer-events: none;
    }
    .target-box {
      position: fixed;
      border-radius: 8px;
      cursor: pointer;
      pointer-events: auto;
      transition: border 150ms, background 150ms, box-shadow 150ms;
    }
    .label {
      position: absolute;
      top: -10px;
      left: 8px;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(22, 100, 255, 0.85);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      line-height: 16px;
      white-space: nowrap;
      transition: opacity 150ms;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._startMeasuring();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._raf);
  }

  private _startMeasuring() {
    const tick = () => {
      this._frameCount++;
      if (this._frameCount % 3 === 0 && this.store) {
        const all = this.store.registry.getAll();
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

  render() {
    return html`
      ${this._targets.map((t) => {
        const hovered = this._hoveredId === t.id;
        return html`
          <div
            class="target-box"
            style="
              top:${t.top}px; left:${t.left}px;
              width:${t.width}px; height:${t.height}px;
              border: 1.5px dashed rgba(${BLUE}, ${hovered ? "0.6" : "0.35"});
              background: rgba(${BLUE}, ${hovered ? "0.08" : "0.04"});
              box-shadow: ${hovered ? `0 2px 12px rgba(${BLUE}, 0.12)` : "none"};
            "
            @click=${() => this._select(t.id)}
            @mouseenter=${() => { this._hoveredId = t.id; }}
            @mouseleave=${() => { this._hoveredId = null; }}
          >
            <div class="label" style="opacity:${hovered ? 1 : 0.7};font-family:${FONT}">${t.label}</div>
          </div>
        `;
      })}
    `;
  }

  private _select(targetId: string) {
    this.dispatchEvent(new CustomEvent("vibeset-select", {
      detail: { targetId },
      bubbles: true,
      composed: true,
    }));
  }
}
