import { SsoCallback } from "auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signing in",
  robots: { index: false, follow: false },
};

/**
 * Where Google sends a person back to. An existing account goes home; a new
 * one goes to the welcome screen to pick its handle.
 */
const SsoCallbackPage = () => (
  <SsoCallback signInRedirect="/" signUpRedirect="/welcome" signInHref="/sign-in" />
);

export default SsoCallbackPage;
