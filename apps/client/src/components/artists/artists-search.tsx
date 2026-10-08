import { Search } from "lucide-react";

type ArtistsSearchProps = {
  query: string;
};

/** Finding an artist by name: a plain form that puts the name in the address, so every search is a page of its own. */
export const ArtistsSearch = ({ query }: ArtistsSearchProps) => (
  <form action="/artists" method="get" role="search" className="w-full max-w-md">
    <label htmlFor="artist-query" className="sr-only">
      Find an artist
    </label>
    <div className="flex items-center gap-2 rounded-control border border-hairline-strong bg-surface px-3 transition-colors focus-within:border-accent">
      <Search size={16} className="shrink-0 text-faint" />
      <input
        id="artist-query"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Find an artist"
        className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-placeholder"
      />
    </div>
  </form>
);
