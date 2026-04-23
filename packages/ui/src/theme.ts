// ── Motion Tuner UI — Theme ─────────────────────────────────────
// Default token set. All CSS classes use `.mt-*` namespace.

export type MotionTunerTheme = "light" | "dark";

export interface ThemeTokens {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  dividerStrong: string;
  divider: string;
  dividerSoft: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  buttonBg: string;
  buttonBgHover: string;
  buttonText: string;
  buttonTextHover: string;
  sliderTrack: string;
  sliderProgress: string;
  sliderThumbBg: string;
  sliderThumbBorder: string;
  sliderThumbBorderHover: string;
  sliderThumbBorderActive: string;
  sliderThumbShadow: string;
  sliderThumbShadowHover: string;
  codeBg: string;
}

export const DARK_TOKENS: ThemeTokens = {
  panelBg: "rgba(15,18,24,0.80)",
  panelBorder: "rgba(255,255,255,0.14)",
  panelShadow: "0 14px 38px rgba(0,0,0,0.42)",
  dividerStrong: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.08)",
  dividerSoft: "rgba(255,255,255,0.06)",
  textPrimary: "rgba(255,255,255,0.9)",
  textSecondary: "rgba(255,255,255,0.72)",
  textTertiary: "rgba(255,255,255,0.48)",
  textMuted: "rgba(255,255,255,0.36)",
  buttonBg: "rgba(255,255,255,0.1)",
  buttonBgHover: "rgba(255,255,255,0.16)",
  buttonText: "rgba(255,255,255,0.62)",
  buttonTextHover: "rgba(255,255,255,0.9)",
  sliderTrack: "rgba(255,255,255,0.18)",
  sliderProgress: "rgba(118,180,255,0.82)",
  sliderThumbBg: "#0F1520",
  sliderThumbBorder: "rgba(255,255,255,0.42)",
  sliderThumbBorderHover: "rgba(255,255,255,0.66)",
  sliderThumbBorderActive: "rgba(255,255,255,0.78)",
  sliderThumbShadow: "0 1px 6px rgba(0,0,0,0.45)",
  sliderThumbShadowHover: "0 2px 8px rgba(0,0,0,0.55)",
  codeBg: "rgba(0,0,0,0.22)",
};

export const LIGHT_TOKENS: ThemeTokens = {
  panelBg: "rgba(255,255,255,0.72)",
  panelBorder: "rgba(0,0,0,0.08)",
  panelShadow: "0 8px 32px rgba(0,0,0,0.08)",
  dividerStrong: "rgba(0,0,0,0.10)",
  divider: "rgba(0,0,0,0.06)",
  dividerSoft: "rgba(0,0,0,0.04)",
  textPrimary: "rgba(0,0,0,0.85)",
  textSecondary: "rgba(0,0,0,0.65)",
  textTertiary: "rgba(0,0,0,0.40)",
  textMuted: "rgba(0,0,0,0.28)",
  buttonBg: "rgba(0,0,0,0.05)",
  buttonBgHover: "rgba(0,0,0,0.10)",
  buttonText: "rgba(0,0,0,0.40)",
  buttonTextHover: "rgba(0,0,0,0.70)",
  sliderTrack: "#E6E9EF",
  sliderProgress: "rgba(0,0,0,0.22)",
  sliderThumbBg: "#fff",
  sliderThumbBorder: "rgba(0,0,0,0.22)",
  sliderThumbBorderHover: "rgba(0,0,0,0.40)",
  sliderThumbBorderActive: "rgba(0,0,0,0.50)",
  sliderThumbShadow: "0 1px 4px rgba(0,0,0,0.12)",
  sliderThumbShadowHover: "0 1px 6px rgba(0,0,0,0.2)",
  codeBg: "rgba(0,0,0,0.025)",
};

export function getTokens(theme: MotionTunerTheme): ThemeTokens {
  return theme === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
}

export const STATE_SELECTOR_DARK = {
  containerBg: "#4F5156",
  containerBorder: "none",
  itemBaseBg: "#4F5156",
  itemBaseText: "#FFFFFF",
  itemActiveBg: "#FFFFFF",
  itemActiveText: "#383A40",
};

export const STATE_SELECTOR_LIGHT = {
  containerBg: "#F5F5F5",
  containerBorder: "1px solid #EFEFEF",
  itemBaseBg: "#F5F5F5",
  itemBaseText: "#383A40",
  itemActiveBg: "#4F5156",
  itemActiveText: "#FFFFFF",
};

export function getStateSelectorTokens(theme: MotionTunerTheme) {
  return theme === "dark" ? STATE_SELECTOR_DARK : STATE_SELECTOR_LIGHT;
}

export const FONT =
  "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const MONO_FONT = "'Monaco', 'Menlo', 'Ubuntu Mono', monospace";
