import { Recommendation } from "services";
import { TitleCard } from "@/components/catalog/title-card";

type RecommendationCardProps = {
  recommendation: Recommendation;
  showType?: boolean;
  sizes: string;
};

/** A pick: the poster card, and under it the one line that says why. */
export const RecommendationCard = ({ recommendation, showType = false, sizes }: RecommendationCardProps) => (
  <div className="flex flex-col gap-2">
    <TitleCard title={recommendation.title} showType={showType} sizes={sizes} />
    <p className="line-clamp-2 text-xs text-faint">
      {recommendation.because ? (
        <>
          Because you loved <span className="text-muted">{recommendation.because.canonicalTitle}</span>
        </>
      ) : recommendation.sharedGenres.length > 0 ? (
        `For your ${recommendation.sharedGenres[0]?.name.toLowerCase()} side`
      ) : (
        "Close to your taste"
      )}
    </p>
  </div>
);
