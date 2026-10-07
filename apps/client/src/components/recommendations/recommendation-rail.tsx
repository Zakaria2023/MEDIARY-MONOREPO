import { listRecommendations, Recommendation } from "services";
import { MediaType } from "@/db/enum";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";

type RecommendationRailProps = {
  userUuid: string;
  /** One medium's picks, or every medium's. */
  mediaType?: MediaType;
  heading: string;
  reason: string;
  /** Inside a hub the rail sits in the page's own gutters; on the home it brings its own. */
  inset?: boolean;
};

const RAIL_SIZES = "(min-width: 640px) 160px, 136px";

/**
 * "FOR YOU": a row of picks from the person's own library, each with its
 * reason. Nothing to say, nothing rendered: a rail of guesses is worse
 * than no rail.
 */
export const RecommendationRail = async ({ userUuid, mediaType, heading, reason, inset = false }: RecommendationRailProps) => {
  const picks: Recommendation[] = await listRecommendations(userUuid, { mediaType });
  if (picks.length === 0) {
    return null;
  }
  const gutter = inset ? "" : "px-5 sm:px-8";

  return (
    <section className="flex flex-col gap-4">
      <div className={`flex flex-col gap-0.5 ${gutter}`}>
        <h2 className="font-display text-lg text-ink sm:text-xl">{heading}</h2>
        <p className="text-sm text-muted">{reason}</p>
      </div>
      <div className={`scrollbar-none flex snap-x gap-4 overflow-x-auto pb-1 ${inset ? "" : "scroll-px-5 px-5 sm:scroll-px-8 sm:px-8"}`}>
        {picks.map((pick) => (
          <div key={pick.title.uuid} className="w-34 shrink-0 snap-start sm:w-40">
            <RecommendationCard recommendation={pick} showType={!mediaType} sizes={RAIL_SIZES} />
          </div>
        ))}
      </div>
    </section>
  );
};
