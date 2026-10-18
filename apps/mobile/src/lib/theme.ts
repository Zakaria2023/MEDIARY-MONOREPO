// THE SITE'S DESIGN TOKENS, for a phone. The values are the dark theme in
// apps/client/src/app/globals.css, which is the one source: a color changed
// there is changed here in the same commit. A component paints only with
// these names, never a hex of its own.

/** Every color the app paints with. */
export const colors = {
  page: "#090a10",
  surface: "#11131c",
  surface2: "#171a26",
  overlay: "#1a1e2b",
  hover: "rgba(255, 255, 255, 0.05)",
  pressed: "rgba(255, 255, 255, 0.09)",
  scrim: "rgba(0, 0, 0, 0.7)",

  ink: "#f7f8fc",
  secondary: "#c9cdd9",
  muted: "#a9afbf",
  faint: "#6e7489",
  placeholder: "#5a6075",

  hairline: "rgba(255, 255, 255, 0.08)",
  hairlineSoft: "rgba(255, 255, 255, 0.05)",
  hairlineStrong: "rgba(255, 255, 255, 0.14)",

  primary: "#4057ff",
  primaryTint: "rgba(64, 87, 255, 0.16)",
  accent: "#1697ff",
  accentTint: "rgba(22, 151, 255, 0.14)",
  violet: "#7b2cff",
  magenta: "#d815ff",
  pink: "#ff2c8a",

  success: "#3ddc97",
  warning: "#f5b14c",
  danger: "#ff5c6c",
  dangerTint: "rgba(255, 92, 108, 0.16)",

  white: "#ffffff",
  /** Only for the shadow under something that floats: a toast, a sheet. */
  shadow: "#000000",
} as const;

/** One color per tracking status, as the library's chips and the stats draw them. */
export const statusColors = {
  in_progress: "#1697ff",
  completed: "#3ddc97",
  paused: "#f5b14c",
  dropped: "#ff5c6c",
  planned: "#a9afbf",
} as const;

/**
 * THE PRIMARY BUTTON'S GRADIENT, the logo's sweep with its stops deepened
 * so white text keeps 4.5:1. One of the five places a gradient is allowed;
 * `GradientButton` is the only thing that reads it.
 */
export const actionGradient = ["#1f6bff", "#3d3bff", "#6a28f5", "#b315e0", "#d61a7a"] as const;

/** The scrim that makes a title legible over its artwork: transparent to the page. */
export const backdropFade = ["rgba(9, 10, 16, 0)", "#090a10"] as const;

export const radius = {
  card: 14,
  control: 10,
  chip: 999,
} as const;

/** A four-point scale, the same steps Tailwind's spacing takes. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

/** The two families the site loads: Sora for headings, Manrope for everything else. */
export const fonts = {
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  display: "Sora_600SemiBold",
  displayRegular: "Sora_400Regular",
} as const;

/** Tailwind's type scale, by the same names. */
export const text = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  "2xl": { fontSize: 24, lineHeight: 32 },
  "3xl": { fontSize: 30, lineHeight: 36 },
} as const;

/** A poster is 2:3, everywhere. */
export const POSTER_RATIO = 2 / 3;
