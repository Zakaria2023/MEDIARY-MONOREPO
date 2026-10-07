import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";

type Props = {
  children: ReactNode;
};

/**
 * The sign-in and sign-up screens share one frame: the mark at the top, the
 * Clerk card in the middle, nothing else. A person arriving here has one
 * thing to do.
 */
const AuthLayout = ({ children }: Props) => (
  <div className="flex min-h-screen flex-col items-center px-5 py-10">
    <Link href="/" aria-label="Mediary home" className="mb-10">
      <Logo />
    </Link>
    <main className="flex w-full max-w-md flex-1 flex-col items-center justify-start">
      {children}
    </main>
  </div>
);

export default AuthLayout;
