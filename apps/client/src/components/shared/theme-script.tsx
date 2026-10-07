type ThemeScriptProps = {
  nonce: string | undefined;
};

/**
 * Settles "match my device" before the first paint: when <html> carries
 * .system, the device's light setting adds .light, and a change of the
 * setting flips it live. Inline so there is no flash of the wrong theme;
 * nonced so the CSP allows it. Dark and light need no script: the class
 * is already on <html> from the cookie.
 */
const SCRIPT = `(function(){var h=document.documentElement;if(!h.classList.contains("system"))return;var m=window.matchMedia("(prefers-color-scheme: light)");function a(){h.classList.toggle("light",m.matches);}a();m.addEventListener("change",a);})();`;

// Browsers hide a nonce's value from the DOM once the page is parsed, so on
// hydration React reads "" against the server's value and would report a
// mismatch for this one attribute. The script has already run by then;
// the warning is suppressed on this element alone.
export const ThemeScript = ({ nonce }: ThemeScriptProps) => (
  <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: SCRIPT }} />
);
