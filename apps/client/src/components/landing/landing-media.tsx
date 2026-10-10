import { launchMediaTypes } from "@/db/enum";
import { LandingMediaCard } from "@/components/landing/landing-media-card";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { readLandingCounts, readLandingTrending } from "@/lib/server/landing-catalog";

/** The most covers any card fans: the full-width last one. */
const MOST_COVERS = 5;

/**
 * ONE LIFECYCLE, EVERY MEDIUM IN ITS OWN WORDS: the product's central idea
 * shown, not told. Every medium has a card of the same design: the five
 * states as that medium says them, read from the same label map the app
 * uses, its unit and how much the catalog holds, and its most followed
 * covers fanned beside them. Two cards to a row; an odd last one spans the
 * row and fans five. Every cover comes from the landing's one read of the most followed.
 */
export const LandingMedia = async () => {
  const [counts, showcase] = await Promise.all([
    readLandingCounts(),
    // The most followed, not the best scored: the covers a visitor knows, and
    // never a little-seen title whose high score rests on a handful of votes.
    readLandingTrending(),
  ]);
  const last = launchMediaTypes.length - 1;
  const oddOneOut = launchMediaTypes.length % 2 === 1;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
      <LandingSectionHeading
        eyebrow="Eight media"
        title="Every medium, in its own words."
        body="A game is played, an album is listened, a book can be a DNF. Mediary speaks each one's language and keeps them all in one history."
      />
      <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {launchMediaTypes.map((mediaType, index) => {
          const wide = oddOneOut && index === last;
          return (
            <li key={mediaType} className={wide ? "md:col-span-2" : ""}>
              <LandingMediaCard
                mediaType={mediaType}
                total={counts[mediaType] ?? 0}
                covers={(showcase[mediaType] ?? []).slice(0, MOST_COVERS)}
                wide={wide}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
};
