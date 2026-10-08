import { ArtistPage } from "services";
import { Badge } from "ui";
import { ArtistAvatar } from "@/components/artists/artist-avatar";
import { yearSpan } from "@/lib/year-span";

type ArtistHeroProps = {
  artist: ArtistPage;
};

/**
 * The top of an artist's page: their picture (the best known record's cover,
 * round), their name, how many records Mediary holds and the years they
 * span, and the genres their records share most.
 */
export const ArtistHero = ({ artist }: ArtistHeroProps) => {
  const years = yearSpan(artist.firstYear, artist.lastYear);

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-5 py-10 text-center sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:py-14 sm:text-start">
        <ArtistAvatar
          name={artist.name}
          coverUrl={artist.coverUrl}
          dominantColor={artist.dominantColor}
          sizes="(min-width: 640px) 208px, 160px"
          priority
          className="w-40 shrink-0 sm:w-52"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Artist</p>
          <h1 className="text-balance font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            {artist.name}
          </h1>
          <p className="tabular text-sm text-muted">
            {artist.recordCount} {artist.recordCount === 1 ? "record" : "records"} in Mediary
            {years && ` · ${years}`}
          </p>
          {artist.genres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {artist.genres.map((genre) => (
                <Badge key={genre.slug}>{genre.name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
