import { listFeed } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { FeedLine } from "@/components/feed/feed-line";

type FeedPageListProps = {
  userUuid: string;
  page: number;
};

/** One page of the feed, or the sentence that explains an empty one. */
export const FeedPageList = async ({ userUuid, page }: FeedPageListProps) => {
  const result = await listFeed(userUuid, { page });

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
        {result.items.map((item) => (
          <FeedLine key={item.uuid} item={item} />
        ))}
      </ol>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/feed", { page: target })}
      />
    </div>
  );
};
