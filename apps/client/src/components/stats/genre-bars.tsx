import { GenreCount } from "services";

type GenreBarsProps = {
  genres: GenreCount[];
};

/** The top genres as bars against the biggest one. Nothing completed yet, a sentence. */
export const GenreBars = ({ genres }: GenreBarsProps) => {
  const max = Math.max(1, ...genres.map((genre) => genre.count));

  if (genres.length === 0) {
    return <p className="text-sm text-muted">Finish a few titles and your genres show up here.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {genres.map((genre) => (
        <li key={genre.name} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 text-secondary">{genre.name}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-chip bg-hairline">
            <div className="h-full rounded-chip bg-accent" style={{ width: `${(genre.count / max) * 100}%` }} />
          </div>
          <span className="tabular w-8 text-end text-ink">{genre.count}</span>
        </li>
      ))}
    </ul>
  );
};
