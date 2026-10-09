import localFont from "next/font/local";

// EVERY FACE IS A FILE IN THE REPO, none is fetched from Google at build time.
// A build cannot fail on a font download, and no request leaves for
// fonts.googleapis.com, which the CSP will not allow anyway. Each file is
// Google's own latin subset of a variable font, so one file covers every
// weight the design uses. All three are SIL OFL 1.1, which permits bundling.
// Here rather than in the layout because the global error screen draws its
// own page and needs the same faces.

// THE DISPLAY FACE: headings, the hero, large numbers on the stats page.
// 400 to 700 because a hero headline is the one place semibold is allowed.
const sora = localFont({
  src: "../fonts/sora-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-sora",
  display: "swap",
});

// THE TEXT FACE: everything that is not a heading. 400 and 500 only, because
// body emphasis stops at medium.
const manrope = localFont({
  src: "../fonts/manrope-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
});

// THE MONOSPACE FACE: scores, hours and episode counts that sit in a column.
const jetBrainsMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** The three faces' CSS variables, for the `<html>` of a layout or the global error screen. */
export const FONT_VARIABLES = [sora.variable, manrope.variable, jetBrainsMono.variable].join(" ");
