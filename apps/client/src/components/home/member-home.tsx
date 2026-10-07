import Link from "next/link";
import { AuthUser } from "services";
import { AsyncSection } from "ui";
import { ExploreRailsSkeleton } from "@/components/catalog/explore-rails-skeleton";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { ContinueRail } from "@/components/home/continue-rail";
import { ContinueRailSkeleton } from "@/components/home/continue-rail-skeleton";
import { FriendsPanel } from "@/components/home/friends-panel";
import { HomeBrowse } from "@/components/home/home-browse";
import { HomeRails } from "@/components/home/home-rails";
import { WeeklySnapshot } from "@/components/home/weekly-snapshot";
import { RecommendationRail } from "@/components/recommendations/recommendation-rail";

type MemberHomeProps = {
  user: AuthUser;
};

/**
 * THE HOME for a signed-in member: a greeting, the week in numbers, what
 * they are in the middle of, their picks, the catalog by medium, and what
 * the people they follow are doing.
 */
export const MemberHome = ({ user }: MemberHomeProps) => (
  <main className="flex flex-1 flex-col gap-12 pb-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-6 px-5 pb-4 pt-20 text-center sm:px-8 sm:pt-24">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-5xl">Welcome back, {user.displayName}</h1>
      <p className="max-w-md text-base text-muted">
        Log an episode, a session or a film in one tap, and everything you finish adds up to your story.
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
    </div>
    <AsyncSection reloadKey={`week-${user.uuid}`} skeleton={<div className="mx-auto h-24 w-full max-w-7xl px-5 sm:px-8" />}>
      <WeeklySnapshot userUuid={user.uuid} />
    </AsyncSection>
    <div className="mx-auto w-full max-w-7xl">
      <AsyncSection reloadKey={`continue-${user.uuid}`} skeleton={<ContinueRailSkeleton />}>
        <ContinueRail userUuid={user.uuid} />
      </AsyncSection>
    </div>
    <div className="mx-auto w-full max-w-7xl">
      <AsyncSection reloadKey={`for-you-${user.uuid}`} skeleton={<TitleRailSkeleton />}>
        <RecommendationRail userUuid={user.uuid} heading="For you" reason="Picked from what you loved, across every medium." />
      </AsyncSection>
    </div>
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
    <AsyncSection
      reloadKey={`friends-${user.uuid}`}
      skeleton={
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <FeedSkeleton rows={3} />
        </div>
      }
    >
      <FriendsPanel userUuid={user.uuid} />
    </AsyncSection>
  </main>
);
