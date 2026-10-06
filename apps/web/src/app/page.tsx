import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { getCurrentUser } from "@/lib/auth";

/**
 * The root: marketing when signed out, home when signed in. Both are
 * placeholders in Step 1. The landing page and the real home arrive with
 * the catalog and the library they show; the foundation only has to prove
 * that a signed-in person lands somewhere that knows who they are.
 */
const HomePage = async () => {
  const user = await getCurrentUser();
  if (user && !user.username) {
    redirect("/welcome");
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 px-5 py-20 text-center sm:px-8">
        {user ? (
          <>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-5xl">
              Welcome back, {user.displayName}
            </h1>
            <p className="max-w-md text-base text-muted">
              Your profile lives at{" "}
              <span className="font-mono text-secondary">/@{user.username}</span>.
              The library, explore and the add sheet arrive in the next steps.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/settings/profile"
                className="inline-flex h-10 items-center rounded-control bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Set up your profile
              </Link>
              <Link
                href="/design"
                className="inline-flex h-10 items-center rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                See the design foundation
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              Your entertainment,{" "}
              <span className="text-brand-gradient">beautifully tracked.</span>
            </h1>
            <p className="max-w-md text-base text-muted">
              One profile for everything you watch, play, read, rate and love.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center rounded-control bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Create your Mediary
              </Link>
              <Link
                href="/design"
                className="inline-flex h-11 items-center rounded-control border border-hairline-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Explore the design
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default HomePage;
