import Link from "next/link";
import { redirect } from "next/navigation";
import { AsyncSection } from "ui";
import { HomeTrending } from "@/components/catalog/home-trending";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { getCurrentUser } from "@/lib/auth";

/**
 * The root: marketing when signed out, home when signed in. The hero is
 * still the foundation's; the landing page and the real home arrive with
 * the library they show. Under it, what is trending, so the first screen
 * already shows the catalog.
 */
const HomePage = async () => {
  const user = await getCurrentUser();
  if (user && !user.username) {
    redirect("/welcome");
  }

  return (
    <main className="flex flex-1 flex-col gap-12 pb-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 px-5 pb-4 pt-20 text-center sm:px-8 sm:pt-24">
        {user ? (
          <>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-5xl">
              Welcome back, {user.displayName}
            </h1>
            <p className="max-w-md text-base text-muted">
              Your profile lives at{" "}
              <span className="font-mono text-secondary">/@{user.username}</span>.
              Tracking arrives with the next step; the catalog is open now.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/explore"
                className="inline-flex h-10 items-center rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
              >
                Explore the catalog
              </Link>
              <Link
                href="/settings/profile"
                className="inline-flex h-10 items-center rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Set up your profile
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
                className="inline-flex h-11 items-center rounded-control bg-action-gradient px-5 text-sm font-medium text-white"
              >
                Create your Mediary
              </Link>
              <Link
                href="/explore"
                className="inline-flex h-11 items-center rounded-control border border-hairline-strong px-5 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Explore without an account
              </Link>
            </div>
          </>
        )}
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <AsyncSection reloadKey="home-trending" skeleton={<TitleRailSkeleton />}>
          <HomeTrending />
        </AsyncSection>
      </div>
    </main>
  );
};

export default HomePage;
