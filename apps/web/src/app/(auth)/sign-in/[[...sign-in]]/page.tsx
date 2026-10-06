import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Clerk's sign-in, in Mediary's colors. The catch-all segment is Clerk's:
 * the multi-step flow (code entry, second factor) lives under this path.
 */
const SignInPage = () => <SignIn />;

export default SignInPage;
