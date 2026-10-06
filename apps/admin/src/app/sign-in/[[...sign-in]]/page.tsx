import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Staff sign-in. The same Clerk instance as the client, so a member's
 * account signs in here too; the dashboard layout then decides, by role,
 * whether it may enter. There is no sign-up: a staff account is a member
 * account that an administrator has promoted.
 */
const SignInPage = () => (
  <main className="flex min-h-screen flex-col items-center px-5 py-10">
    <div className="mb-10">
      <Logo />
    </div>
    <div className="flex w-full max-w-md flex-1 flex-col items-center justify-start">
      <SignIn />
    </div>
  </main>
);

export default SignInPage;
