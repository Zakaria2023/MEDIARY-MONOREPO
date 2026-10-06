import { Search } from "lucide-react";
import { Metadata } from "next";
import { AsyncSection, Input } from "ui";
import { firstParam, parseLaunchMediaType } from "validators";
import { SearchResults } from "@/components/search/search-results";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => {
  const query = firstParam((await searchParams).q)?.trim() ?? "";
  return pageMetadata({
    title: query ? `Search: ${query}` : "Search",
    description: "Search movies, TV shows, games and anime on Mediary.",
    path: "/search",
    // A results page is a view of other pages; the titles it links to are
    // what belongs in the index.
    noIndex: true,
  });
};

/**
 * UNIVERSAL SEARCH: every medium at once, every name a title goes by, with
 * a filter per medium. The form is a plain GET, so a search is a URL that
 * can be shared or come back to, and it works before any script loads.
 */
const SearchPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const mediaType = parseLaunchMediaType(firstParam(params.type));
  const page = Number(firstParam(params.page)) || 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading size="page" title={query ? `Results for “${query}”` : "Search"} />
      <form action="/search" method="get" role="search" className="max-w-xl">
        {mediaType && <input type="hidden" name="type" value={mediaType} />}
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Movies, shows, games, anime"
          aria-label="Search Mediary"
          icon={<Search size={16} />}
        />
      </form>
      <AsyncSection
        reloadKey={`${query}|${mediaType ?? "all"}|${page}`}
        skeleton={<SearchResultsSkeleton />}
      >
        <SearchResults query={query} mediaType={mediaType} page={page} />
      </AsyncSection>
    </main>
  );
};

export default SearchPage;
