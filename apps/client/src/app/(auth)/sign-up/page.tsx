import { SignUpForm } from "auth";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create your Mediary",
  description:
    "Create a free Mediary account: one profile for every movie, show, game and anime you love.",
  path: "/sign-up",
});

/** Create an account. A confirmed email goes straight to the welcome screen for a handle. */
const SignUpPage = () => (
  <SignUpForm redirectTo="/welcome" ssoCallbackPath="/sso-callback" signInHref="/sign-in" />
);

export default SignUpPage;
