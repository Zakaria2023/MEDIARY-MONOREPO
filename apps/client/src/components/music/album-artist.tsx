import { ChevronRight, Mic } from "lucide-react";
import Link from "next/link";
import { artistPath } from "@/lib/artist-path";

type AlbumArtistProps = {
  name: string;
  slug: string;
  /** The credit as the record prints it, when it names more than the artist. */
  credit: string;
};

/** Who made the record, as a way to their page and everything else they made. */
export const AlbumArtist = ({ name, slug, credit }: AlbumArtistProps) => (
  <Link
    href={artistPath(slug)}
    className="group flex w-full max-w-md items-center gap-4 rounded-card border border-hairline bg-surface p-3 pe-4 transition-colors hover:border-hairline-strong"
  >
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
      <Mic size={20} />
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="text-xs text-faint">Artist</span>
      <span className="line-clamp-1 text-base font-medium text-ink">{name}</span>
      {credit !== name && <span className="line-clamp-1 text-xs text-muted">{credit}</span>}
    </span>
    <span className="flex shrink-0 items-center gap-1 text-sm text-muted transition-colors group-hover:text-ink">
      Discography
      <ChevronRight size={16} />
    </span>
  </Link>
);
