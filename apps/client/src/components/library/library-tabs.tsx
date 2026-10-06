import { getLibraryCounts } from "services";
import { LibraryMediaTabs } from "@/components/library/library-media-tabs";
import { LibraryStatusTabs } from "@/components/library/library-status-tabs";
import { LibraryQuery } from "@/lib/library-query";

type LibraryTabsProps = {
  userUuid: string;
  query: LibraryQuery;
};

/** The medium row and the status row, each tab carrying its count. */
export const LibraryTabs = async ({ userUuid, query }: LibraryTabsProps) => {
  const counts = await getLibraryCounts(userUuid, query.mediaType);

  return (
    <div className="flex flex-col gap-5">
      <LibraryMediaTabs query={query} counts={counts} />
      <LibraryStatusTabs query={query} counts={counts} />
    </div>
  );
};
