export const hostTheme = {
  panel: "#070d1c",
  backgroundTop: 0x0b1226,
  backgroundBottom: 0x050912,

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

  text: "#f8fafc",
  muted: "#94a3b8",
  dim: "#64748b",

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
