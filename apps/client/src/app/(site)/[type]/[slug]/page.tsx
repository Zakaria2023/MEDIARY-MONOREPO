import { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogFacts, getTitleTracking, listChoicesForTitle, PRODUCT_EVENTS, track } from "services";
import { AsyncSection, Badge } from "ui";
import { parseLaunchMediaType } from "validators";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { PcRequirements } from "@/components/catalog/pc-requirements";
import { RelatedTitles } from "@/components/catalog/related-titles";
import { AlbumArtist } from "@/components/music/album-artist";
import { AlbumTracklist } from "@/components/music/album-tracklist";
import { MoreFromArtist } from "@/components/music/more-from-artist";
import { TitleCommunity } from "@/components/catalog/title-community";
import { TitleCommunitySkeleton } from "@/components/catalog/title-community-skeleton";
import { TitleHero } from "@/components/catalog/title-hero";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { TitleReviews } from "@/components/reviews/title-reviews";
import { TitleReviewsSkeleton } from "@/components/reviews/title-reviews-skeleton";
import { Playthroughs } from "@/components/tracking/playthroughs";
import { PlaythroughsSkeleton } from "@/components/tracking/playthroughs-skeleton";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth";
import { EXPLORE_COPY } from "@/lib/explore-copy";
import { hubPath } from "@/lib/hub-path";
import { loadTitle } from "@/lib/load-title";
import { pageMetadata } from "@/lib/seo";
import { graph, titleNodes } from "@/lib/structured-data";
import { titleDescription } from "@/lib/title-description";
import { titlePath } from "@/lib/title-path";

type Props = {
  params: Promise<{ type: string; slug: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { type, slug } = await params;
  const title = await loadTitle(type, slug);
  if (!title) {
    return { title: "Title not found", robots: { index: false, follow: true } };
  }
  const path = titlePath(title);
  const label = title.releaseYear
    ? `${title.canonicalTitle} (${title.releaseYear})`
    : title.canonicalTitle;

  return pageMetadata({
    title: `${label}: ${MEDIA_TYPE_LABELS[title.mediaType]}`,
    description: titleDescription(title),
    path,
    ownImage: true,
    keywords: [
      title.canonicalTitle,
      ...title.titles.map((entry) => entry.title).filter((name) => name !== title.canonicalTitle),
      ...title.genres.map((genre) => genre.name),
    ].slice(0, 10),
  });
};

/**
 * THE CANONICAL PAGE FOR A TITLE: /movie/inception. The hero, the synopsis
 * and the facts render on the server; "More like this" streams in after.
 * Public, crawlable, and the page every link to a title points at.
 */
const TitlePage = async ({ params }: Props) => {
  const { type, slug } = await params;
  const [title, viewer] = await Promise.all([loadTitle(type, slug), getCurrentUser()]);
  if (!title) {
    notFound();
  }
  const [tracking, listChoices] = viewer
    ? await Promise.all([getTitleTracking(viewer.uuid, title.uuid), listChoicesForTitle(viewer.uuid, title.uuid)])
    : [null, []];
  track(PRODUCT_EVENTS.mediaOpened, { mediaType: title.mediaType, member: viewer !== null, tracked: Boolean(tracking?.entry) });
  const facts = catalogFacts(title);
  const music = title.details?.kind === "music" ? title.details : null;
  const pcRequirements = title.details?.kind === "game" ? title.details.pcRequirements : null;
  const launchType = parseLaunchMediaType(title.mediaType);
  const section = launchType ? EXPLORE_COPY[launchType].heading : MEDIA_TYPE_LABELS[title.mediaType];

  return (
    <main className="flex flex-col">
      <JsonLd
        data={graph(
          titleNodes(title, [
            { name: "Explore", path: "/explore" },
            { name: section, path: launchType ? hubPath(launchType) : "/explore" },
            { name: title.canonicalTitle, path: titlePath(title) },
          ]),
        )}
      />
      <TitleHero title={title} viewer={viewer} tracking={tracking} listChoices={listChoices} />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-faint">About</h2>
            <p className="max-w-2xl text-base leading-relaxed text-secondary">
              {title.description ?? "No synopsis yet."}
            </p>
          </section>

          {facts.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Details</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col gap-0.5">
                    <dt className="text-muted">{fact.label}</dt>
                    <dd className="text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {music?.artistPage && (
            <AlbumArtist name={music.artistPage.name} slug={music.artistPage.slug} credit={music.artist} />
          )}

          {music && music.tracks.length > 0 && <AlbumTracklist tracks={music.tracks} />}

          {title.platforms.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Platforms</h2>
              <div className="flex flex-wrap gap-1.5">
                {title.platforms.map((platform) => (
                  <Badge key={platform.slug}>{platform.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {pcRequirements && <PcRequirements requirements={pcRequirements} />}

          {viewer && tracking?.entry && title.mediaType === "game" && (
            <AsyncSection reloadKey={`runs-${title.uuid}`} skeleton={<PlaythroughsSkeleton />}>
              <Playthroughs userUuid={viewer.uuid} mediaUuid={title.uuid} platforms={tracking.target.platforms} />
            </AsyncSection>
          )}

          <AsyncSection reloadKey={`members-${title.uuid}`} skeleton={<TitleCommunitySkeleton />}>
            <TitleCommunity
              mediaUuid={title.uuid}
              mediaType={title.mediaType}
              viewerScore={tracking?.entry?.score ?? null}
            />
          </AsyncSection>

          <AsyncSection reloadKey={`reviews-${title.uuid}-${viewer?.uuid ?? "guest"}`} skeleton={<TitleReviewsSkeleton />}>
            <TitleReviews title={title} viewer={viewer} />
          </AsyncSection>
        </div>
      </div>

      {music?.artistPage && (
        <div className="mx-auto w-full max-w-7xl pb-4">
          <AsyncSection reloadKey={`more-${title.uuid}`} skeleton={<TitleRailSkeleton />}>
            <MoreFromArtist
              artistUuid={music.artistPage.uuid}
              artistName={music.artistPage.name}
              artistSlug={music.artistPage.slug}
              mediaUuid={title.uuid}
            />
          </AsyncSection>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl pb-8">
        <AsyncSection reloadKey={title.uuid} skeleton={<TitleRailSkeleton />}>
          <RelatedTitles mediaUuid={title.uuid} mediaType={title.mediaType} />
        </AsyncSection>
      </div>
    </main>
  );
};

export default TitlePage;
