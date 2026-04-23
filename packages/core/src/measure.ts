// ── Motion Tuner Core — Measure ─────────────────────────────────
// Migrated from wedata/components/ui/motion-target-overlay.tsx:36-96
// Pure DOM — zero React dependency.

export type Bounds = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const ZERO_BOUNDS: Bounds = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Clip `rect` to the visible area of any overflow-clipping ancestor
 * up to (but not including) `root`.
 */
export function clipToVisibleArea(
  rect: DOMRect,
  el: Element,
  root: HTMLElement,
): { left: number; top: number; right: number; bottom: number } | null {
  const clipped = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };

  let ancestor = el.parentElement;
  while (ancestor && ancestor !== root) {
    const style = getComputedStyle(ancestor);
    const ov = style.overflow + style.overflowX + style.overflowY;
    if (/hidden|scroll|auto|clip/.test(ov)) {
      const ar = ancestor.getBoundingClientRect();
      clipped.left = Math.max(clipped.left, ar.left);
      clipped.top = Math.max(clipped.top, ar.top);
      clipped.right = Math.min(clipped.right, ar.right);
      clipped.bottom = Math.min(clipped.bottom, ar.bottom);
      if (clipped.left >= clipped.right || clipped.top >= clipped.bottom) {
        return null;
      }
    }
    ancestor = ancestor.parentElement;
  }

  return clipped;
}

/**
 * Measure visual extent of all descendants relative to `root`,
 * respecting overflow clipping. Returns how far content extends
 * beyond root's own bounding box on each side.
 */
export function measure(root: HTMLElement): Bounds {
  const rr = root.getBoundingClientRect();
  let minX = 0;
  let minY = 0;
  let maxX = rr.width;
  let maxY = rr.height;

  root.querySelectorAll("*").forEach((el) => {
    // Skip overlay decoration layers (SDK overlay elements)
    if ((el as HTMLElement).dataset?.motionOverlay !== undefined) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;

    const visible = clipToVisibleArea(r, el, root);
    if (!visible) return;

    const l = visible.left - rr.left;
    const t = visible.top - rr.top;
    const w = visible.right - visible.left;
    const h = visible.bottom - visible.top;
    if (l < minX) minX = l;
    if (t < minY) minY = t;
    if (l + w > maxX) maxX = l + w;
    if (t + h > maxY) maxY = t + h;
  });

  return {
    top: minY,
    right: maxX - rr.width,
    bottom: maxY - rr.height,
    left: minX,
  };
}

/** Merge two Bounds to their union (maximum extent). */
export function union(a: Bounds, b: Bounds): Bounds {
  return {
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
    left: Math.min(a.left, b.left),
  };
}

/** Zero-extent bounds constant. */
export { ZERO_BOUNDS };
