import { SignInForm } from "auth";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description: "Sign in to Mediary to track everything you watch and play.",
  path: "/sign-in",
  noIndex: true,
});

/** Sign in, in Mediary's own form. A new account goes on to the welcome screen from home. */
const SignInPage = () => (
  <SignInForm
    redirectTo="/"
    ssoCallbackPath="/sso-callback"
    forgotPasswordHref="/forgot-password"
    signUpHref="/sign-up"
  />
);

export default SignInPage;
