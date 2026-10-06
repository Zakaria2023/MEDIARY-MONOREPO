import { TasteMatchPage } from "services";
import { TitleCard } from "@/components/catalog/title-card";
import { SectionHeading } from "@/components/shared/section-heading";

type TasteRecommendationsProps = {
  /** What the viewer is called in the headings: "You". */
  viewerName: string;
  page: TasteMatchPage;
};

const SHARED_SIZES = "(min-width: 640px) 25vw, 33vw";
const PAIR_SIZES = "(min-width: 640px) 20vw, 50vw";

/** What both love, then what each would hand the other. Empty sections are not drawn. */
export const TasteRecommendations = ({ viewerName, page }: TasteRecommendationsProps) => (
  <>
    {page.sharedFavorites.length > 0 && (
      <section className="flex flex-col gap-4">
        <SectionHeading title="Shared favorites" description="Both of you scored these 8 or higher." />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
          {page.sharedFavorites.map((title) => (
            <TitleCard key={title.uuid} title={title} showType sizes={SHARED_SIZES} />
          ))}
        </div>
      </section>
    )}
    {(page.theyLove.length > 0 || page.youLove.length > 0) && (
      <div className="grid gap-8 sm:grid-cols-2">
        {page.theyLove.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeading title={`${page.other.displayName} loves, ${viewerName.toLowerCase()} have not tried`} />
            <div className="grid grid-cols-2 gap-3">
              {page.theyLove.map((title) => (
                <TitleCard key={title.uuid} title={title} showType sizes={PAIR_SIZES} />
              ))}
            </div>
          </section>
        )}
        {page.youLove.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionHeading title={`${viewerName} love, ${page.other.displayName} has not tried`} />
            <div className="grid grid-cols-2 gap-3">
              {page.youLove.map((title) => (
                <TitleCard key={title.uuid} title={title} showType sizes={PAIR_SIZES} />
              ))}
            </div>
          </section>
        )}
      </div>
    )}
  </>
);
