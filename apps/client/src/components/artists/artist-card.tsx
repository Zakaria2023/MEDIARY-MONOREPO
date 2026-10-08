import Link from "next/link";
import { ArtistCard as ArtistCardData } from "services";
import { ArtistAvatar } from "@/components/artists/artist-avatar";
import { artistPath } from "@/lib/artist-path";

type ArtistCardProps = {
  artist: ArtistCardData;
  sizes: string;
  priority?: boolean;
};

/** An artist in a grid or a row: their round picture, their name and how many records. The whole card opens their page. */
export const ArtistCard = ({ artist, sizes, priority = false }: ArtistCardProps) => (
  <Link
    href={artistPath(artist.slug)}
    className="group flex flex-col items-center gap-3 rounded-card p-2 text-center transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
  >
    <ArtistAvatar
      name={artist.name}
      coverUrl={artist.coverUrl}
      dominantColor={artist.dominantColor}
      sizes={sizes}
      priority={priority}
      className="w-full transition-transform duration-200 group-hover:scale-102"
    />
    <span className="flex flex-col gap-0.5">
      <span className="line-clamp-2 text-sm font-medium text-ink">{artist.name}</span>
      <span className="tabular text-xs text-faint">
        {artist.recordCount} {artist.recordCount === 1 ? "record" : "records"}
      </span>
    </span>
  </Link>
);
