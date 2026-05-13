// ── Vibeset UI — Launcher (Lit 3) ───────────────────────────
// Bottom-right floating button. Pointer-capture drag, no portal.
// Shows mode-dependent content: entry point / selecting hint / editing controls.

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { EditorSessionMode } from "../core/index.js";
import type { VibesetTheme } from "./theme.js";
import { FONT } from "./theme.js";

// ── Inline SVG icons ────────────────────────────────────────

const iconPointerClick = (size = 16) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
    <path d="M2 2l8 8"/>
  </svg>`;

const iconSparkles = (size = 14) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/>
    <path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>`;

const iconLogOut = (size = 14) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <path d="m16 17 5-5-5-5"/>
    <path d="M21 12H9"/>
  </svg>`;

const iconX = (size = 15) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>`;

const iconCopy = (size = 13) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 8H10a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z"/>
    <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>
  </svg>`;

const iconRotate = (size = 13) => html`
  <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>`;

// ── vibeset-launcher ────────────────────────────────────────

@customElement("vibeset-launcher")
export class VibesetLauncher extends LitElement {
  /* ── public attributes ─────────────────────────────────── */

  @property() theme: VibesetTheme = "dark";
  @property() mode: EditorSessionMode = "idle";
  @property({ attribute: "change-count", type: Number }) changeCount = 0;

  /* ── internal state ────────────────────────────────────── */

  @state() private _expanded = false;
  @state() private _bottom = 24;
  @state() private _right = 24;

  private _drag: {
    startX: number;
    startY: number;
    startBottom: number;
    startRight: number;
    moved: boolean;
  } | null = null;

  /* ── derived ───────────────────────────────────────────── */

  private get _isDark() {
    return this.theme === "dark";
  }

  private get _isCollapsed() {
    return this.mode === "idle" && !this._expanded;
  }

  private get _hoverBg() {
    return this._isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)";
  }

  /* ── events ────────────────────────────────────────────── */

  private _fire(type: string, detail?: Record<string, unknown>) {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    );
  }

  /* ── drag handlers ─────────────────────────────────────── */

  private _onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, [role=button]")) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    this._drag = {
      startX: e.clientX,
      startY: e.clientY,
      startBottom: this._bottom,
      startRight: this._right,
      moved: false,
    };
  };

  private _onPointerMove = (e: PointerEvent) => {
    if (!this._drag) return;
    const dx = e.clientX - this._drag.startX;
    const dy = e.clientY - this._drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._drag.moved = true;
    this._bottom = this._drag.startBottom - dy;
    this._right = this._drag.startRight - dx;
  };

  private _onPointerUp = () => {
    const wasDrag = this._drag?.moved;
    this._drag = null;
    if (!wasDrag && this._isCollapsed) {
      this._expanded = true;
    }
  };

  /* ── hover helpers ─────────────────────────────────────── */

  private _hoverOn = (e: MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = this._hoverBg;
  };

  private _hoverOff = (e: MouseEvent) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

  /* ── styles ────────────────────────────────────────────── */

  static override styles = css`
    :host {
      display: block;
      position: fixed;
      z-index: 99999;
      touch-action: none;
    }
  `;

  /* ── render helpers ────────────────────────────────────── */

  private _pillStyles() {
    const dk = this._isDark;
    return {
      height: "44px",
      borderRadius: "22px",
      border: dk
        ? "1px solid rgba(255,255,255,0.20)"
        : "1px solid rgba(0,0,0,0.14)",
      background: dk
        ? "linear-gradient(180deg, rgba(24,27,34,0.96) 0%, rgba(10,12,16,0.97) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(242,245,251,0.96) 100%)",
      boxShadow: dk
        ? "0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.16)"
        : "0 8px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.86)",
      display: "flex",
      alignItems: "center",
      color: dk ? "rgba(255,255,255,0.96)" : "rgba(0,0,0,0.76)",
      fontSize: "13px",
      fontWeight: "500",
      fontFamily: FONT,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      padding: "4px",
      whiteSpace: "nowrap",
      cursor: this._isCollapsed ? "pointer" : "grab",
      width: this._isCollapsed ? "148px" : "auto",
      minWidth: "148px",
      transition: "width 0.24s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden",
    };
  }

  private _btnStyles(muted = false) {
    const dk = this._isDark;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      height: "36px",
      padding: "0 10px",
      borderRadius: "18px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500",
      fontFamily: FONT,
      color: muted
        ? dk ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"
        : dk ? "rgba(255,255,255,0.94)" : "rgba(0,0,0,0.76)",
      transition: "background 120ms",
      whiteSpace: "nowrap",
      outline: "none",
    };
  }

  private _iconBtnStyles() {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      borderRadius: "18px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      transition: "background 120ms",
      flexShrink: "0",
      outline: "none",
      color: "inherit",
    };
  }

  private _divider() {
    const dk = this._isDark;
    return html`<span style=${styleMap({
      width: "1px",
      height: "20px",
      background: dk ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.16)",
      flexShrink: "0",
      margin: "0 4px",
    })}></span>`;
  }

  /* ── content by mode ───────────────────────────────────── */

  private _renderContent() {
    const isIdle = this.mode === "idle";
    const isSelecting = this.mode === "selecting";
    const isEditing = this.mode === "editing";

    if (this._isCollapsed) {
      return html`
        <div style="display:flex;align-items:center;justify-content:center;width:100%;gap:4px">
          ${iconPointerClick(16)} 动效编辑
        </div>`;
    }

    if (isIdle && this._expanded) {
      return html`
        <button style=${styleMap(this._btnStyles())}
          @click=${() => this._fire("vibeset-start-selecting")}
          @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
          ${iconSparkles()} 开始编辑
        </button>
        ${this._divider()}
        <button style=${styleMap(this._iconBtnStyles())}
          @click=${() => { this._expanded = false; }}
          @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
          ${iconX()}
        </button>`;
    }

    if (isSelecting) {
      return html`
        <span style=${styleMap({ ...this._btnStyles(true), cursor: "default" })}>选择组件</span>
        <button style=${styleMap(this._btnStyles())}
          @click=${() => this._fire("vibeset-exit-editor")}
          @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
          ${iconLogOut()} 退出
        </button>`;
    }

    if (isEditing) {
      return html`
        <button style=${styleMap(this._btnStyles())}
          @click=${() => this._fire("vibeset-reselect")}
          @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
          ${iconPointerClick(14)} 重选
        </button>
        <button style=${styleMap(this._btnStyles())}
          @click=${() => this._fire("vibeset-exit-editor")}
          @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
          ${iconLogOut()} 退出
        </button>
        ${this.changeCount > 0 ? html`
          ${this._divider()}
          <span style=${styleMap({ ...this._btnStyles(true), cursor: "default" })}>${this.changeCount} 处修改</span>
          <button style=${styleMap(this._iconBtnStyles())} title="复制代码"
            @click=${() => this._fire("vibeset-copy-changes")}
            @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
            ${iconCopy()}
          </button>
          <button style=${styleMap(this._iconBtnStyles())} title="重置全部"
            @click=${() => this._fire("vibeset-reset-all")}
            @mouseenter=${this._hoverOn} @mouseleave=${this._hoverOff}>
            ${iconRotate()}
          </button>` : nothing}`;
    }

    return nothing;
  }

  /* ── render ────────────────────────────────────────────── */

  override render() {
    return html`
      <div
        part="pill"
        data-editor-ui=""
        style=${styleMap(this._pillStyles())}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
      >
        ${this._renderContent()}
      </div>`;
  }

  override updated() {
    this.style.bottom = `${this._bottom}px`;
    this.style.right = `${this._right}px`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibeset-launcher": VibesetLauncher;
  }
}
