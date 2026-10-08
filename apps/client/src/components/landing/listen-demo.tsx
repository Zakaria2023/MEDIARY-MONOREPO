import { ArrowUpRight, AudioLines } from "lucide-react";
import { CatalogCard } from "services";
import { Poster } from "ui";

type ListenDemoProps = {
  /** A well loved record from the catalog, shown as where the song was found. */
  album: CatalogCard | null;
};

/** The listening ring's fixed share of the clip in the still. */
const PROGRESS = "w-3/5";

/**
 * A still of Name that song: the listening orb inside its rings, the clip
 * part way through, and the record the song is on. It names a real album
 * and no song, so it claims nothing about what is on it.
 */
export const ListenDemo = ({ album }: ListenDemoProps) => (
  <div className="flex flex-col items-center gap-6">
    <div className="relative flex size-40 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-hairline" />
      <span className="absolute inset-3 rounded-full bg-accent-tint" />
      <span className="absolute inset-7 rounded-full bg-accent-tint" />
      <span className="relative flex size-20 items-center justify-center rounded-full border border-accent bg-surface-2 text-accent">
        <AudioLines size={30} />
      </span>
    </div>
    <div className="flex w-40 flex-col items-center gap-2">
      <span className="text-xs font-medium text-ink">Listening…</span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
        <div className={`h-full rounded-full bg-accent ${PROGRESS}`} />
      </div>
    </div>
    {album && (
      <div className="flex w-full items-center gap-3 rounded-card border border-hairline bg-surface p-2.5">
        <div className="w-12 shrink-0">
          <Poster src={album.coverUrl} alt="" sizes="48px" radius="control" dominantColor={album.dominantColor} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs text-accent">Found it, on the record</span>
          <span className="line-clamp-1 text-sm font-medium text-ink">{album.canonicalTitle}</span>
          {album.releaseYear && <span className="text-xs text-faint">{album.releaseYear}</span>}
        </div>
        <ArrowUpRight size={16} className="shrink-0 text-faint" />
      </div>
    )}
  </div>
);
