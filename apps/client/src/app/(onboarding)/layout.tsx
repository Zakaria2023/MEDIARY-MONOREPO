import { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { requireUser } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * The gate for the welcome screen: signed in, but not necessarily finished
 * signing up. It is its own group rather than part of (app) because (app)
 * requires a username, which is the thing this screen exists to collect.
 */
const OnboardingLayout = async ({ children }: Props) => {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-10">
      <div className="mb-10">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
};

export default OnboardingLayout;
