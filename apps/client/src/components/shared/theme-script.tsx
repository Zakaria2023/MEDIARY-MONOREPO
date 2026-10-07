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

export const ThemeScript = ({ nonce }: ThemeScriptProps) => (
  <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT }} />
);
