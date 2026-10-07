import { listCatalogShowcase } from "services";
import { launchMediaTypes } from "@/db/enum";
import { DiaryDemo } from "@/components/landing/diary-demo";
import { LandingFeatureRow } from "@/components/landing/landing-feature-row";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { MatchDemo } from "@/components/landing/match-demo";
import { StatsDemo } from "@/components/landing/stats-demo";
import { TrackDemo } from "@/components/landing/track-demo";
import { firstWithCover } from "@/lib/first-with-cover";

/**
 * WHAT IT IS LIKE TO USE: four features, each beside a still of the
 * product drawn from real titles in the catalog, so the page shows the
 * thing it promises. The titles change with what is trending.
 */
export const LandingFeatures = async () => {
  const [trending, top] = await Promise.all([
    listCatalogShowcase({ sort: "trending", perMedium: 2, withCover: true }),
    listCatalogShowcase({ sort: "top", perMedium: 1, withCover: true }),
  ]);
  const anime = trending.anime ?? [];
  const movies = trending.movie ?? [];
  const books = trending.book ?? [];
  const music = trending.music ?? [];
  const library = [...firstWithCover(anime), ...firstWithCover(movies), ...firstWithCover(books)];
  const week = [...firstWithCover(movies, 1), ...firstWithCover(books, 1), ...firstWithCover(music), ...firstWithCover(anime, 1)];
  const shared = launchMediaTypes.flatMap((mediaType) => top[mediaType] ?? []);

  return (
    <section className="border-y border-hairline bg-surface/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-5 py-24 sm:px-8 sm:py-32 lg:gap-32">
        <LandingSectionHeading
          eyebrow="How it feels"
          title="Built for the way you actually binge."
          body="Logging should take a second and give something back. Every tap becomes history, every finish becomes a stat, and your profile fills itself in."
        />
        <LandingFeatureRow
          eyebrow="Track"
          title="One tap, and it counts."
          body="Episode, chapter, hour or play: tick it off from your library, a title page or the home. Mediary knows how long each thing is and finishes it for you when you reach the end."
          points={[
            "Statuses in each medium's own words",
            "Scores, rewatches, platforms and playthroughs",
            "Airing shows know which episode is out",
          ]}
          visual={<TrackDemo titles={library} />}
        />
        <LandingFeatureRow
          reverse
          eyebrow="Diary"
          title="Your diary writes itself."
          body="Every step you log lands in your diary on the day it happened, in your own time zone. Correct a date, add a note, and look back on any week of your life in posters."
          points={["Built from what you log, never guessed", "Notes and dates you can correct", "Cards on your profile for others to see, if you want"]}
          visual={<DiaryDemo titles={week} />}
        />
        <LandingFeatureRow
          eyebrow="Stats"
          title="A year across everything."
          body="Hours watched, played, read and heard, in one place for the first time. See which medium took your year, what you finish and what you drop, and share the recap."
          points={["Time estimated from each title's real length", "Milestones as you pass them", "A yearly recap card made to be shared"]}
          visual={<StatsDemo />}
        />
        <LandingFeatureRow
          reverse
          eyebrow="Taste Match"
          title="Find out who really gets you."
          body="Compare tastes with anyone who allows it: a match across every medium, the favorites you share, and what each of you should try next from the other."
          points={["Recommendations that say why", "Follow friends and see what they finish", "Likes and replies on reviews"]}
          visual={<MatchDemo shared={shared} />}
        />
      </div>
    </section>
  );
};
