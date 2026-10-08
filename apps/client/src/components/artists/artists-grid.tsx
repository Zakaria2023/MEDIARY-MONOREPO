import { Mic } from "lucide-react";
import Link from "next/link";
import { listArtists } from "services";
import { Pagination } from "ui";
import { ArtistCard } from "@/components/artists/artist-card";
import { artistsPath } from "@/lib/artist-path";

type ArtistsGridProps = {
  query: string;
  page: number;
};

/** Three across on a phone, six on a wide desktop: round pictures with the name under each. */
export const ARTIST_GRID_CLASSES = "grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6";

const ARTIST_SIZES = "(min-width: 1024px) 190px, (min-width: 640px) 22vw, 30vw";

/** A page of artists, best known first, or the ones whose name matches; links to the pages either side. */
export const ArtistsGrid = async ({ query, page }: ArtistsGridProps) => {
  const result = await listArtists({ query, page });

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <Mic size={28} className="text-faint" />
        <p className="text-base font-medium text-ink">{query ? `No artist called “${query}” yet` : "No artists yet"}</p>
        <p className="max-w-sm text-sm text-muted">
          {query ? "Try part of the name, or look for one of their albums instead." : "They appear as their records come in."}
        </p>
        {query && (
          <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-sm font-medium text-accent hover:text-accent-hover">
            Search every title for “{query}”
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className={ARTIST_GRID_CLASSES}>
        {result.items.map((artist, index) => (
          <ArtistCard key={artist.uuid} artist={artist} sizes={ARTIST_SIZES} priority={index < 6} />
        ))}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => artistsPath({ page: next, query })} />
    </div>
  );
};
