import { ArtistCard as ArtistCardData } from "services";
import { ArtistCard } from "@/components/artists/artist-card";

type SearchArtistsProps = {
  artists: ArtistCardData[];
};

/** The artists named like the search, above the titles: a band is found by its name, not its records'. */
export const SearchArtists = ({ artists }: SearchArtistsProps) => (
  <section aria-labelledby="search-artists-heading" className="flex flex-col gap-3">
    <h2 id="search-artists-heading" className="text-xs font-medium uppercase tracking-wide text-faint">
      Artists
    </h2>
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {artists.map((artist) => (
        <li key={artist.uuid}>
          <ArtistCard artist={artist} sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 33vw" />
        </li>
      ))}
    </ul>
  </section>
);
