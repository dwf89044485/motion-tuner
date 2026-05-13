import { describe, it, expect } from "vitest";
import { union, ZERO_BOUNDS } from "./measure.js";
import type { Bounds } from "./measure.js";

// Note: clipToVisibleArea and measure depend on DOM APIs (getBoundingClientRect,
// getComputedStyle, querySelectorAll). They'll be tested in the react/ui layer
// with jsdom. Here we test the pure logic: union and ZERO_BOUNDS.

describe("measure — pure logic", () => {
  it("ZERO_BOUNDS is all zeros", () => {
    expect(ZERO_BOUNDS).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("union of two bounds returns max extent", () => {
    const a: Bounds = { top: -5, right: 10, bottom: 20, left: -3 };
    const b: Bounds = { top: -2, right: 15, bottom: 10, left: -8 };
    expect(union(a, b)).toEqual({ top: -5, right: 15, bottom: 20, left: -8 });
  });

  it("union with ZERO_BOUNDS preserves non-zero", () => {
    const a: Bounds = { top: -5, right: 10, bottom: 20, left: -3 };
    expect(union(a, ZERO_BOUNDS)).toEqual({ top: -5, right: 10, bottom: 20, left: -3 });
  });

  it("union is commutative", () => {
    const a: Bounds = { top: -1, right: 5, bottom: 3, left: -2 };
    const b: Bounds = { top: -3, right: 2, bottom: 7, left: -1 };
    expect(union(a, b)).toEqual(union(b, a));
  });
});
