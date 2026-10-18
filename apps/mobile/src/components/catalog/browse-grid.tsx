import { CloudOff, Inbox } from "lucide-react-native";
import { LaunchMediaType } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { StateMessage } from "@/components/ui/state-message";
import { BROWSE_SORTS, useBrowseScreen } from "@/hooks/catalog/use-browse-screen";
import { BrowseFilters } from "./browse-filters";
import { PosterGrid } from "./poster-grid";
import { PosterGridSkeleton } from "./poster-grid-skeleton";

type BrowseGridProps = {
  mediaType: LaunchMediaType;
  initialGenre: string | undefined;
};

/** One medium's every public title, filtered by order and genre, loaded page by page. */
export const BrowseGrid = ({ mediaType, initialGenre }: BrowseGridProps) => {
  const { sort, genre, grid, cards, genres, onSort, onGenre } = useBrowseScreen(mediaType, initialGenre);
  const filters = (
    <BrowseFilters sorts={BROWSE_SORTS} sort={sort} genres={genres} genre={genre} onSort={onSort} onGenre={onGenre} />
  );
  if (grid.isError) {
    return (
      <StateMessage
        icon={CloudOff}
        title="These titles did not load"
        body={grid.error.message}
        actionLabel="Try again"
        onAction={() => void grid.refetch()}
      />
    );
  }
  return (
    <PosterGrid
      cards={cards}
      header={filters}
      empty={
        grid.isPending ? (
          <PosterGridSkeleton />
        ) : (
          <StateMessage
            icon={Inbox}
            title="Nothing here yet"
            body={`No ${MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase()} match these filters. Try another genre or order.`}
          />
        )
      }
      hasMore={grid.hasNextPage}
      loadingMore={grid.isFetchingNextPage}
      onEndReached={() => void grid.fetchNextPage()}
      refreshing={grid.isRefetching && !grid.isFetchingNextPage}
      onRefresh={() => void grid.refetch()}
    />
  );
};
