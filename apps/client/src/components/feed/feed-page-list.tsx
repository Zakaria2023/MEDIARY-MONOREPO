import { listFeed, pickSponsoredPlacement } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { FeedLine } from "@/components/feed/feed-line";
import { SponsoredCard } from "@/components/sponsored/sponsored-card";

type FeedPageListProps = {
  userUuid: string;
  page: number;
};

/** Lines above the sponsored card, on the first page only. */
const SPONSORED_AFTER = 3;

/**
 * One page of the feed, or the sentence that explains an empty one. The
 * first page of a feed long enough carries one sponsored card after its
 * first lines, outside the list of lines, so it is never read as something
 * a person you follow did.
 */
export const FeedPageList = async ({ userUuid, page }: FeedPageListProps) => {
  const [result, placement] = await Promise.all([
    listFeed(userUuid, { page }),
    page === 1 ? pickSponsoredPlacement({ surface: "feed", viewerUuid: userUuid }).catch(() => null) : Promise.resolve(null),
  ]);
  const split = placement && result.items.length > SPONSORED_AFTER ? SPONSORED_AFTER : result.items.length;

  if (result.total === 0) {
    return (
      <CatalogEmptyState
        heading="Your feed is quiet"
        body="Open someone's profile and press Follow. What they watch, play and finish shows up here."
        action={{ label: "Explore the catalog", href: "/explore" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
        {result.items.slice(0, split).map((item) => (
          <FeedLine key={item.uuid} item={item} />
        ))}
      </ol>
      {placement && split < result.items.length && (
        <>
          <aside aria-label="Sponsored">
            <SponsoredCard placement={placement} canReport />
          </aside>
          <ol
            start={split + 1}
            className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface"
          >
            {result.items.slice(split).map((item) => (
              <FeedLine key={item.uuid} item={item} />
            ))}
          </ol>
        </>
      )}
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/feed", { page: target })}
      />
    </div>
  );
};
