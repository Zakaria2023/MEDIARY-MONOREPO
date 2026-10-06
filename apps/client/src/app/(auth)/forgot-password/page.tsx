import { ResetPasswordForm } from "auth";
import { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description: "Choose a new password for your Mediary account.",
  path: "/forgot-password",
  noIndex: true,
});

/** Forgot password: a code by email, then a new password. */
const ForgotPasswordPage = () => <ResetPasswordForm redirectTo="/" signInHref="/sign-in" />;

export default ForgotPasswordPage;
