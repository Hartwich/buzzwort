import { tokenColor, tokens } from "./platformTheme.js";
export const hostTheme = {
  get panel() {
    return tokens().color.surface;
  },
  get backgroundTop() {
    return tokenColor((theme) => theme.color.background);
  },
  get backgroundBottom() {
    return tokenColor((theme) => theme.color.backgroundDeep);
  },

  surface: 0x101c34,
  surfaceSoft: 0x16233d,
  outline: 0x2a3c5e,
  outlineSoft: 0x1d2b47,

  accent: 0x60a5fa,
  accentSoft: 0xbfdbfe,
  positive: 0x4ade80,
  warning: 0xfbbf24,
  danger: 0xf87171,

  team1: 0x60a5fa,
  team2: 0xf472b6,

  titleFont: '"Space Grotesk", sans-serif',
  bodyFont: '"Nunito Sans", sans-serif',
  monoFont: '"JetBrains Mono", Consolas, monospace',

  text: tokens().color.text,
  muted: tokens().color.muted,
  dim: tokens().color.muted,

  css: {
    accent: "#60a5fa",
    positive: "#4ade80",
    warning: "#fbbf24",
    danger: "#f87171",
    team1: "#60a5fa",
    team2: "#f472b6"
  }
} as const;

export function toCss(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}
