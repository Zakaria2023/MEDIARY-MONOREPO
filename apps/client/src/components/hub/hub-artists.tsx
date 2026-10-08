import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { listArtists } from "services";
import { ArtistCard } from "@/components/artists/artist-card";
import { artistsPath } from "@/lib/artist-path";

const SHOWN = 12;
const SIZES = "(min-width: 640px) 152px, 120px";

/**
 * The music hub's way in by artist: the best known artists as a row of
 * round pictures, each opening their discography, and the link to all of
 * them. Nothing until the first artist is in.
 */
export const HubArtists = async () => {
  const { items, total } = await listArtists({ pageSize: SHOWN });
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">Artists</h2>
          <p className="text-sm text-muted">Pick one for every album they made and the songs on each.</p>
        </div>
        <Link
          href={artistsPath()}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          All {total.toLocaleString("en-US")}
          <ChevronRight size={16} />
        </Link>
      </div>
      <ul className="flex snap-x gap-2 overflow-x-auto px-3 pb-2 sm:gap-3 sm:px-6">
        {items.map((artist) => (
          <li key={artist.uuid} className="w-30 shrink-0 snap-start sm:w-38">
            <ArtistCard artist={artist} sizes={SIZES} />
          </li>
        ))}
      </ul>
    </section>
  );
};
