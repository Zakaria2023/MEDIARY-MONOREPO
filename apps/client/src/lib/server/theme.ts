import { cookies } from "next/headers";
import { ThemePrefs } from "@/db/types";

/** The theme as the page is drawn: the person's choice, or the device's when they said so. */
export type Theme = ThemePrefs["theme"];

/** What the root layout needs to draw the right theme before anything loads. */
export type Appearance = {
  theme: Theme;
  reducedMotion: boolean;
};

/**
 * THE APPEARANCE COOKIES. The choice lives on the profile row, but the root
 * layout draws every page, signed in or not, before it knows who is looking;
 * the cookie is what it reads, and the appearance action sets both. A new
 * device starts dark until the person chooses again there.
 */
export const THEME_COOKIE = "mediary-theme";
export const MOTION_COOKIE = "mediary-motion";

/** A year: the choice should outlive a session. */
export const APPEARANCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const THEMES: readonly Theme[] = ["dark", "light", "system"];

/** The theme a cookie value names, or dark for anything else. */
export const parseTheme = (value: string | undefined): Theme =>
  THEMES.find((theme) => theme === value) ?? "dark";

/** The appearance the request carries. */
export const readAppearance = async (): Promise<Appearance> => {
  const jar = await cookies();
  return {
    theme: parseTheme(jar.get(THEME_COOKIE)?.value),
    reducedMotion: jar.get(MOTION_COOKIE)?.value === "reduced",
  };
};

/** The classes <html> carries for an appearance; "system" is settled by the script in the layout. */
export const appearanceClasses = ({ theme, reducedMotion }: Appearance): string =>
  [theme === "light" ? "light" : "", theme === "system" ? "system" : "", reducedMotion ? "reduce-motion" : ""]
    .filter(Boolean)
    .join(" ");
