import { AsyncSection } from "ui";
import { LibraryBulkBar } from "@/components/library/library-bulk-bar";
import { LibraryControls } from "@/components/library/library-controls";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryList } from "@/components/library/library-list";
import { LibrarySelectionProvider } from "@/components/library/library-selection-provider";
import { LibraryListSkeleton } from "@/components/library/library-list-skeleton";
import { LibraryTabs } from "@/components/library/library-tabs";
import { LibraryTabsSkeleton } from "@/components/library/library-tabs-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { LibraryQuery } from "@/lib/library-query";

type LibraryViewProps = {
  query: LibraryQuery;
};

/**
 * THE LIBRARY SCREEN, shared by the all-media page and each medium's page.
 * The heading and the controls are static and land first; the tabs stream
 * in with their counts and the list with its rows, each behind its own
 * boundary so a slow count never holds the rows back.
 */
export const LibraryView = async ({ query }: LibraryViewProps) => {
  // Gated by the (app) layout; this is the cached lookup, for the uuid.
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const listKey = [
    query.mediaType,
    query.status,
    query.search,
    query.favorites,
    query.minScore,
    query.sort,
    query.view,
    query.page,
  ].join("|");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Your library"
        description="Everything you are watching, playing and planning."
      />
      <AsyncSection reloadKey={`tabs-${query.mediaType ?? "all"}`} skeleton={<LibraryTabsSkeleton />}>
        <LibraryTabs userUuid={user.uuid} query={query} />
      </AsyncSection>
      <LibraryFilters query={query} />
      <LibrarySelectionProvider>
        <LibraryControls query={query} />
        <AsyncSection reloadKey={listKey} skeleton={<LibraryListSkeleton view={query.view} />}>
          <LibraryList userUuid={user.uuid} query={query} />
        </AsyncSection>
        <LibraryBulkBar mediaType={query.mediaType} />
      </LibrarySelectionProvider>
    </main>
  );
};
