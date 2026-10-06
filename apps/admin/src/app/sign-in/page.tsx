import { SignInForm } from "auth";
import { Metadata } from "next";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Staff sign-in. SIGN-IN ONLY: the admin never creates an account, so there
 * is no sign-up link and no Google button (a Google sign-in from an unknown
 * address would quietly create one). A staff account is a member account an
 * administrator has promoted; the dashboard layout checks the role.
 */
const SignInPage = () => (
  <main className="flex min-h-screen flex-col items-center px-5 py-10">
    <div className="mb-10">
      <Logo />
    </div>
    <div className="flex w-full max-w-md flex-1 flex-col">
      <SignInForm
        redirectTo="/"
        ssoCallbackPath="/sign-in"
        forgotPasswordHref="/forgot-password"
        signUpHref={null}
        showGoogle={false}
        heading="Staff sign in"
        description="Use the account an administrator gave staff access to."
      />
    </div>
  </main>
);

export default SignInPage;
