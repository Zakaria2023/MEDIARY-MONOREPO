import Link from "next/link";
import { Logo } from "@/components/shared/logo";

/**
 * A placeholder until the landing page is built in a later step. It points
 * at the design sandbox so the foundation is one click away.
 */
const HomePage = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
    <Logo />
    <p className="max-w-sm text-sm text-muted">
      Your entertainment, beautifully tracked. The product is being built; the
      design foundation is ready to look at.
    </p>
    <Link
      href="/design"
      className="inline-flex h-10 items-center rounded-control bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
    >
      Open the design foundation
    </Link>
  </main>
);

export default HomePage;
