import { ResetPasswordForm } from "auth";
import { Metadata } from "next";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Reset your password",
};

/** A staff member who has forgotten their password resets it here. */
const ForgotPasswordPage = () => (
  <main className="flex min-h-screen flex-col items-center px-5 py-10">
    <div className="mb-10">
      <Logo />
    </div>
    <div className="flex w-full max-w-md flex-1 flex-col">
      <ResetPasswordForm redirectTo="/" signInHref="/sign-in" />
    </div>
  </main>
);

export default ForgotPasswordPage;
