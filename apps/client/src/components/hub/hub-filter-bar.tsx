import Link from "next/link";
import { findArtistBySlug, listCatalogGenres } from "services";
import { catalogSorts } from "validators";
import { artistsPath } from "@/lib/artist-path";
import { SORT_LABELS } from "@/lib/explore-copy";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubHref, HubQuery, recentYears, SCORE_STEPS } from "@/lib/hub-query";
import { listArtists, listHubFacetOptions } from "@/lib/server/catalog-cache";

type HubFilterBarProps = {
  query: HubQuery;
};

type Chip = {
  key: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

const CHIP = "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors";

const chipClass = (active: boolean) =>
  `${CHIP} ${active ? "bg-surface-2 text-ink" : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"}`;

/** Artists offered as chips on the music hub; the rest are a link away. */
const ARTIST_CHIPS = 20;

/**
 * THE HUB'S FILTERS, every one a link that keeps the others: the order,
 * the medium's own facet, the genres and, for music, the artists. A choice
 * with no titles is never offered. Picking anything goes back to the first
 * page; the member's own status filter is kept.
 */
export const HubFilterBar = async ({ query }: HubFilterBarProps) => {
  const copy = HUB_COPY[query.mediaType];
  const isMusic = query.mediaType === "music";
  const [options, genres, topArtists, chosenArtist] = await Promise.all([
    listHubFacetOptions(query.mediaType, copy.facet.kind),
    listCatalogGenres(query.mediaType),
    isMusic ? listArtists({ pageSize: ARTIST_CHIPS }).then((result) => result.items) : Promise.resolve([]),
    query.artist ? findArtistBySlug(query.artist) : Promise.resolve(null),
  ]);
  const at = (changes: Partial<HubQuery>) => hubHref({ ...query, ...changes, page: 1 });

  const sorts: Chip[] = catalogSorts.map((sort) => ({
    key: sort,
    label: SORT_LABELS[sort],
    href: at({ sort }),
    active: sort === query.sort,
  }));
  const facets: Chip[] = [
    { key: "all", label: `All ${copy.facet.label.toLowerCase()}s`, href: at({ facet: undefined }), active: !query.facet },
    ...options.map((option) => ({
      key: option.value,
      label: option.label,
      href: at({ facet: option.value }),
      active: option.value === query.facet,
      count: option.titleCount,
    })),
  ];
  const scoreChips: Chip[] = [
    { key: "any", label: "Any score", href: at({ score: undefined }), active: query.score === undefined },
    ...SCORE_STEPS.map((step) => ({
      key: String(step),
      label: `${step}+`,
      href: at({ score: step }),
      active: query.score === step,
    })),
  ];
  const yearChips: Chip[] = [
    { key: "any", label: "Any year", href: at({ year: undefined }), active: !query.year },
    ...recentYears().map((year) => ({
      key: String(year),
      label: String(year),
      href: at({ year: String(year) }),
      active: query.year === String(year),
    })),
    { key: "older", label: "Older", href: at({ year: "older" }), active: query.year === "older" },
  ];
  const genreChips: Chip[] = [
    { key: "all", label: "All genres", href: at({ genre: undefined }), active: !query.genre },
    ...genres.map((genre) => ({
      key: genre.slug,
      label: genre.name,
      href: at({ genre: genre.slug }),
      active: genre.slug === query.genre,
    })),
  ];

  // The chosen artist always has a chip, even one outside the best known,
  // so the filter that is on can always be seen and taken off.
  const artistOptions = [
    ...(chosenArtist && !topArtists.some((artist) => artist.slug === chosenArtist.slug) ? [chosenArtist] : []),
    ...topArtists,
  ];
  const artistChips: Chip[] = [
    { key: "all", label: "All artists", href: at({ artist: undefined }), active: !query.artist },
    ...artistOptions.map((artist) => ({
      key: artist.slug,
      label: artist.name,
      href: at({ artist: artist.slug }),
      active: artist.slug === query.artist,
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Sort" className="flex items-center gap-1 border-b border-hairline">
        {sorts.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            aria-current={chip.active ? "page" : undefined}
            className={`-mb-px flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
              chip.active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {chip.label}
          </Link>
        ))}
      </nav>
      {options.length > 0 && (
        <nav aria-label={copy.facet.label} className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {facets.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
              {chip.count !== undefined && <span className="tabular text-xs text-faint">{chip.count}</span>}
            </Link>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <nav aria-label="Score" className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
          {scoreChips.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Year" className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
          {yearChips.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
        </nav>
      </div>
      {genres.length > 0 && (
        <nav aria-label="Genres" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {genreChips.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
        </nav>
      )}
      {isMusic && topArtists.length > 0 && (
        <nav aria-label="Artists" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {artistChips.map((chip) => (
            <Link key={chip.key} href={chip.href} aria-current={chip.active ? "page" : undefined} className={chipClass(chip.active)}>
              {chip.label}
            </Link>
          ))}
          <Link href={artistsPath()} className={`${CHIP} text-accent hover:text-accent-hover`}>
            More artists
          </Link>
        </nav>
      )}
    </div>
  );
};
