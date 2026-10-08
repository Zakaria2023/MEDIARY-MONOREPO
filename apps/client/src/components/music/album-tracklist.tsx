import { MusicTrack } from "@/db/types";
import { groupTracksByDisc, totalTrackSeconds } from "@/lib/group-tracks";
import { formatTrackLength } from "@/lib/track-length";

type AlbumTracklistProps = {
  tracks: MusicTrack[];
};

/**
 * A record's songs, as the record lists them: number, title and length on
 * one line each, a heading per disc when there is more than one, and the
 * count and running time over the list.
 */
export const AlbumTracklist = ({ tracks }: AlbumTracklistProps) => {
  const discs = groupTracksByDisc(tracks);
  const total = formatTrackLength(totalTrackSeconds(tracks));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">Tracks</h2>
        <span className="tabular text-xs text-faint">
          {tracks.length} {tracks.length === 1 ? "song" : "songs"}
          {total && ` · ${total}`}
        </span>
      </div>
      <div className="flex flex-col gap-5">
        {discs.map(({ disc, tracks: songs }) => (
          <div key={disc} className="flex flex-col gap-2">
            {discs.length > 1 && <h3 className="text-sm font-medium text-muted">Disc {disc}</h3>}
            <ol className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface">
              {songs.map((track) => (
                <li
                  key={`${track.disc}-${track.position}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-hover"
                >
                  <span className="tabular w-6 shrink-0 text-end text-sm text-faint">{track.position}</span>
                  <span className="line-clamp-1 min-w-0 flex-1 text-sm text-ink">{track.title}</span>
                  <span className="tabular shrink-0 text-sm text-muted">{formatTrackLength(track.lengthSeconds) ?? ""}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
};
