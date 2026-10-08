import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { SongMatch } from "services";
import { Poster } from "ui";
import { titlePath } from "@/lib/title-path";

type SongResultProps = {
  match: SongMatch;
};

/**
 * What the clip was: the song and its artist, then the record it is on as
 * a poster row that opens the album in Mediary. A record Mediary does not
 * hold yet is offered as a search instead.
 */
export const SongResult = ({ match: { song, album } }: SongResultProps) => (
  <section aria-label="The song" className="flex w-full animate-rise flex-col gap-5 rounded-card border border-hairline bg-surface p-5 sm:p-6">
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wider text-accent">That’s</span>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{song.title}</h2>
      <p className="text-sm text-secondary">
        {song.artist}
        {song.releaseDate && <span className="text-faint"> · {song.releaseDate.slice(0, 4)}</span>}
      </p>
    </div>
    {album ? (
      <Link
        href={titlePath(album)}
        className="group flex items-center gap-4 rounded-card border border-hairline bg-overlay p-3 transition-colors hover:border-hairline-strong"
      >
        <div className="w-16 shrink-0">
          <Poster src={album.coverUrl} alt="" sizes="64px" radius="control" dominantColor={album.dominantColor} />
        </div>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-faint">On the record</span>
          <span className="line-clamp-2 text-sm font-medium text-ink">{album.canonicalTitle}</span>
          {album.releaseYear && <span className="text-xs text-faint">{album.releaseYear}</span>}
        </span>
        <ArrowUpRight size={18} className="shrink-0 text-faint transition-colors group-hover:text-accent" />
      </Link>
    ) : (
      <Link
        href={`/search?q=${encodeURIComponent(`${song.album ?? song.title} ${song.artist}`)}`}
        className="flex h-10 w-fit items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
      >
        <Search size={16} />
        Look for {song.album ? "the record" : "it"} in Mediary
      </Link>
    )}
  </section>
);
