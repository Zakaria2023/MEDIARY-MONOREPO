import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AsyncSection } from "ui";
import { filterHref } from "utils";
import { firstParam, parseCatalogSort, parseLaunchMediaType } from "validators";
import { ExploreGrid } from "@/components/catalog/explore-grid";
import { GenreChips } from "@/components/catalog/genre-chips";
import { GenreChipsSkeleton } from "@/components/catalog/genre-chips-skeleton";
import { SortTabs } from "@/components/catalog/sort-tabs";
import { TitleGridSkeleton } from "@/components/catalog/title-grid-skeleton";
import { TypeTabs } from "@/components/catalog/type-tabs";
import { JsonLd } from "@/components/seo/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { EXPLORE_COPY, SORT_LABELS } from "@/lib/explore-copy";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { breadcrumbNode, graph } from "@/lib/structured-data";

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const mediaType = parseLaunchMediaType((await params).type);
  if (!mediaType) {
    return {};
  }
  const query = await searchParams;
  const sort = parseCatalogSort(firstParam(query.sort));
  const genre = firstParam(query.genre);
  const page = Number(firstParam(query.page)) || 1;
  const copy = EXPLORE_COPY[mediaType];
  const sortLabel = SORT_LABELS[sort];

  return pageMetadata({
    title: sort === "trending" ? `${copy.heading}: trending, top rated and upcoming` : `${sortLabel} ${copy.noun}`,
    description: copy.description,
    // The order is a view of the same set; the canonical keeps the genre and
    // the page, which change what is listed, and drops the sort.
    path: filterHref(`/explore/${mediaType}`, { genre, page }),
  });
};

/**
 * One medium's discovery page: the heading, the medium tabs, the order and
 * the genre filters, then the grid. Every filter is a link, so every view
 * has a URL; the grid alone reloads when one changes.
 */
const ExploreTypePage = async ({ params, searchParams }: Props) => {
  const mediaType = parseLaunchMediaType((await params).type);
  if (!mediaType) {
    notFound();
  }
  const query = await searchParams;
  const sort = parseCatalogSort(firstParam(query.sort));
  const genre = firstParam(query.genre);
  const page = Number(firstParam(query.page)) || 1;
  const path = `/explore/${mediaType}`;
  const copy = EXPLORE_COPY[mediaType];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-10">
      <JsonLd
        data={graph([
          breadcrumbNode(`${absoluteUrl(path)}#breadcrumb`, [
            { name: "Explore", path: "/explore" },
            { name: copy.heading, path },
          ]),
        ])}
      />
      <SectionHeading size="page" title={copy.heading} description={copy.intro} />
      <TypeTabs current={mediaType} />
      <SortTabs path={path} current={sort} genre={genre} />
      <AsyncSection reloadKey={`genres-${mediaType}`} skeleton={<GenreChipsSkeleton />}>
        <GenreChips mediaType={mediaType} path={path} sort={sort} current={genre} />
      </AsyncSection>
      <AsyncSection reloadKey={`${mediaType}|${sort}|${genre ?? ""}|${page}`} skeleton={<TitleGridSkeleton />}>
        <ExploreGrid mediaType={mediaType} path={path} sort={sort} genre={genre} page={page} />
      </AsyncSection>
    </main>
  );
};

export default ExploreTypePage;
