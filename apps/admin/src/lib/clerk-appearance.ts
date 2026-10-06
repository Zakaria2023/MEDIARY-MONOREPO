import type { Appearance } from "@clerk/types";

/**
 * Clerk's hosted components, painted with Mediary's tokens. The values are
 * the same hex as globals.css; Clerk cannot read a CSS variable for its
 * `variables` block, so they are restated here and must move together.
 *
 * `elements` overrides the few pieces whose defaults fight the design: the
 * card gets a hairline instead of a shadow, and the primary button gets the
 * indigo fill with white text.
 */
export const CLERK_APPEARANCE: Appearance = {
  variables: {
    colorPrimary: "#4057ff",
    colorBackground: "#11131c",
    colorInputBackground: "#171a26",
    colorInputText: "#f7f8fc",
    colorText: "#f7f8fc",
    colorTextSecondary: "#a9afbf",
    colorNeutral: "#f7f8fc",
    colorDanger: "#ff5c6c",
    colorSuccess: "#3ddc97",
    colorWarning: "#f5b14c",
    borderRadius: "10px",
    fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
    fontWeight: { normal: 400, medium: 500, semibold: 500, bold: 500 },
  },
  elements: {
    card: "border border-hairline bg-surface shadow-none",
    cardBox: "shadow-none",
    headerTitle: "font-display",
    formButtonPrimary:
      "bg-primary text-white hover:bg-primary-hover shadow-none",
    footer: "hidden",
    socialButtonsBlockButton: "border-hairline-strong text-ink hover:bg-hover",
    formFieldInput: "border-hairline-strong focus:border-accent",
  },
};
