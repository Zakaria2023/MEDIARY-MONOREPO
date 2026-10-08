import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { ArtistsGrid } from "@/components/artists/artists-grid";
import { ArtistsGridSkeleton } from "@/components/artists/artists-grid-skeleton";
import { ArtistsSearch } from "@/components/artists/artists-search";
import { SectionHeading } from "@/components/shared/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { artistsPath } from "@/lib/artist-path";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbNode, graph } from "@/lib/structured-data";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const page = Number(firstParam(params.page)) || 1;
  return pageMetadata({
    title: page > 1 ? `Artists, page ${page}` : "Artists",
    description: "Every artist in Mediary, the best known first. Open one for their albums, EPs and singles, and every song on them.",
    path: artistsPath({ page }),
    // A search is for the person typing it, not for an index.
    noIndex: Boolean(query),
  });
};

/**
 * ARTISTS: everyone with a record in Mediary, the best known first, and a
 * search by name. Each opens their page and their discography. The grid
 * streams in; the heading and the search are in the first bytes.
 */
const ArtistsPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const page = Number(firstParam(params.page)) || 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <JsonLd
        data={graph([
          breadcrumbNode(`${artistsPath()}#breadcrumb`, [
            { name: "Music", path: "/music" },
            { name: "Artists", path: artistsPath() },
          ]),
        ])}
      />
      <SectionHeading
        size="page"
        title="Artists"
        description="Pick an artist for every album they made, and every song on them."
      />
      <ArtistsSearch query={query} />
      <AsyncSection reloadKey={`artists-${query}-${page}`} skeleton={<ArtistsGridSkeleton />}>
        <ArtistsGrid query={query} page={page} />
      </AsyncSection>
    </main>
  );
};

export default ArtistsPage;
