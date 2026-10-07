import Link from "next/link";
import { redirect } from "next/navigation";
import { AsyncSection } from "ui";
import { ExploreRailsSkeleton } from "@/components/catalog/explore-rails-skeleton";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { ContinueRail } from "@/components/home/continue-rail";
import { ContinueRailSkeleton } from "@/components/home/continue-rail-skeleton";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { FriendsPanel } from "@/components/home/friends-panel";
import { HomeBrowse } from "@/components/home/home-browse";
import { HomeRails } from "@/components/home/home-rails";
import { RecommendationRail } from "@/components/recommendations/recommendation-rail";
import { WeeklySnapshot } from "@/components/home/weekly-snapshot";
import { getCurrentUser } from "@/lib/auth";

/**
 * The root: marketing when signed out, home when signed in. A member gets
 * a greeting, what they are in the middle of, their picks, then the whole
 * catalog by medium; a visitor gets the promise and the same catalog under it.
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
              Log an episode, a session or a film in one tap, and everything
              you finish adds up to your story.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/library"
                className="inline-flex h-10 items-center rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
              >
                Open your library
              </Link>
              <Link
                href="/explore"
                className="inline-flex h-10 items-center rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
              >
                Find something new
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
      {user && (
        <AsyncSection reloadKey={`week-${user.uuid}`} skeleton={<div className="mx-auto h-24 w-full max-w-7xl px-5 sm:px-8" />}>
          <WeeklySnapshot userUuid={user.uuid} />
        </AsyncSection>
      )}
      {user && (
        <div className="mx-auto w-full max-w-7xl">
          <AsyncSection reloadKey={`continue-${user.uuid}`} skeleton={<ContinueRailSkeleton />}>
            <ContinueRail userUuid={user.uuid} />
          </AsyncSection>
        </div>
      )}
      {user && (
        <div className="mx-auto w-full max-w-7xl">
          <AsyncSection reloadKey={`for-you-${user.uuid}`} skeleton={<TitleRailSkeleton />}>
            <RecommendationRail
              userUuid={user.uuid}
              heading="For you"
              reason="Picked from what you loved, across every medium."
            />
          </AsyncSection>
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl">
        <AsyncSection reloadKey="home-browse" skeleton={<TitleRailSkeleton />}>
          <HomeBrowse />
        </AsyncSection>
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <AsyncSection reloadKey="home-rails" skeleton={<ExploreRailsSkeleton />}>
          <HomeRails />
        </AsyncSection>
      </div>
      {user && (
        <AsyncSection reloadKey={`friends-${user.uuid}`} skeleton={<div className="mx-auto w-full max-w-7xl px-5 sm:px-8"><FeedSkeleton rows={3} /></div>}>
          <FriendsPanel userUuid={user.uuid} />
        </AsyncSection>
      )}
    </main>
  );
};

export default HomePage;
