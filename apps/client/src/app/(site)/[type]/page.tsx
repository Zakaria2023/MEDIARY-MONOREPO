import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AsyncSection } from "ui";
import { filterHref } from "utils";
import { parseLaunchMediaType } from "validators";
import { HubArtists } from "@/components/hub/hub-artists";
import { HubArtistsSkeleton } from "@/components/hub/hub-artists-skeleton";
import { HubFilterBar } from "@/components/hub/hub-filter-bar";
import { HubFilterBarSkeleton } from "@/components/hub/hub-filter-bar-skeleton";
import { HubGrid } from "@/components/hub/hub-grid";
import { HubHero } from "@/components/hub/hub-hero";
import { HubRails } from "@/components/hub/hub-rails";
import { HubTracking } from "@/components/hub/hub-tracking";
import { HubTrackingSkeleton } from "@/components/hub/hub-tracking-skeleton";
import { RecommendationRail } from "@/components/recommendations/recommendation-rail";
import { TitleGridSkeleton } from "@/components/catalog/title-grid-skeleton";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath, parseHubSlug } from "@/lib/hub-path";
import { parseHubQuery } from "@/lib/hub-query";
import { SORT_LABELS } from "@/lib/explore-copy";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { breadcrumbNode, graph } from "@/lib/structured-data";

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const mediaType = parseHubSlug((await params).type);
  if (!mediaType) {
    return {};
  }
  const query = parseHubQuery(mediaType, await searchParams);
  const copy = HUB_COPY[mediaType];
  const filtered = query.genre || query.facet || query.sort !== "trending";

  return pageMetadata({
    title: filtered ? `${SORT_LABELS[query.sort]} ${copy.noun}` : `${copy.heading}: trending, top rated and coming soon`,
    description: copy.description,
    // The order and the member's own filter are views of the same set; the
    // canonical keeps the genre, the facet and the page.
    path: filterHref(hubPath(mediaType), { genre: query.genre, facet: query.facet, page: query.page }),
  });
};

/**
 * A MEDIUM'S HUB, /anime, /games, /movies, /tv, /music: its own hero, its
 * own two rails, its own filter beside genres, the grid, and, for a member,
 * their own titles in this medium with the statuses as filters. Every
 * filter is a link, so every view has a URL; the sections stream in behind
 * the hero.
 */
const HubPage = async ({ params, searchParams }: Props) => {
  const { type } = await params;
  const mediaType = parseHubSlug(type);
  if (!mediaType) {
    // /movie is a title's address space; the hub reads /movies.
    const singular = parseLaunchMediaType(type);
    if (singular) {
      redirect(hubPath(singular));
    }
    notFound();
  }
  const query = parseHubQuery(mediaType, await searchParams);
  const viewer = await getCurrentUser();
  const copy = HUB_COPY[mediaType];
  const path = hubPath(mediaType);
  const gridKey = [query.sort, query.genre, query.facet, query.score, query.year, query.artist, query.page].join("|");

  return (
    <main className="flex flex-col gap-10 pb-10">
      <JsonLd
        data={graph([
          breadcrumbNode(`${absoluteUrl(path)}#breadcrumb`, [
            { name: "Explore", path: "/explore" },
            { name: copy.heading, path },
          ]),
        ])}
      />
      <HubHero mediaType={mediaType} />

      {viewer && (
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <AsyncSection reloadKey={`mine-${mediaType}-${query.mine ?? "all"}`} skeleton={<HubTrackingSkeleton />}>
            <HubTracking userUuid={viewer.uuid} query={query} />
          </AsyncSection>
        </div>
      )}

      {viewer && (
        <AsyncSection reloadKey={`for-you-${mediaType}-${viewer.uuid}`} skeleton={<TitleRailSkeleton />}>
          <RecommendationRail
            userUuid={viewer.uuid}
            mediaType={mediaType}
            heading={`${copy.heading} for you`}
            reason={`Picked from the ${copy.noun} you loved.`}
          />
        </AsyncSection>
      )}

      {mediaType === "music" && (
        <div className="mx-auto w-full max-w-7xl">
          <AsyncSection reloadKey="hub-artists" skeleton={<HubArtistsSkeleton />}>
            <HubArtists />
          </AsyncSection>
        </div>
      )}

      <AsyncSection reloadKey={`rails-${mediaType}`} skeleton={<TitleRailSkeleton />}>
        <HubRails mediaType={mediaType} />
      </AsyncSection>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg text-ink sm:text-xl">All {copy.noun}</h2>
          <p className="text-sm text-muted">
            Narrow it by {copy.facet.label.toLowerCase()}, genre{mediaType === "music" ? " and artist" : ""}.
          </p>
        </div>
        <AsyncSection reloadKey={`filters-${mediaType}`} skeleton={<HubFilterBarSkeleton />}>
          <HubFilterBar query={query} />
        </AsyncSection>
        <AsyncSection reloadKey={gridKey} skeleton={<TitleGridSkeleton />}>
          <HubGrid query={query} />
        </AsyncSection>
      </div>
    </main>
  );
};

export default HubPage;
