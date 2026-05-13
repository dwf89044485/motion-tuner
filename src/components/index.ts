// ── Vibeset Web Components — Registration ────────────────────
// Importing this file auto-registers all custom elements.

export { VibesetSlider } from "./vibeset-slider.js";
export { VibesetXYPad } from "./vibeset-xy-pad.js";
export { VibesetPanel } from "./vibeset-panel.js";
export { VibesetLauncher } from "./vibeset-launcher.js";
export { VibesetOverlay } from "./vibeset-overlay.js";
export { VibesetEditor } from "./vibeset-editor.js";

export function registerComponents(): void {
  // Components auto-register via @customElement decorator on import.
  // This function exists as an explicit entry point if needed.
}
