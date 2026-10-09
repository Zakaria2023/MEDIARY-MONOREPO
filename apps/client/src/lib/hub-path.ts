import { LaunchMediaType, launchMediaTypes } from "@/db/enum";

/**
 * A MEDIUM'S HUB ADDRESS: plural where English is plural, so a person
 * reads /movies and /games, while a title keeps the medium's code in its
 * own address, /movie/inception. The one place the two are related.
 */
export const HUB_SLUGS: Record<LaunchMediaType, string> = {
  anime: "anime",
  game: "games",
  movie: "movies",
  tv: "tv",
  music: "music",
  manga: "manga",
  comic: "comics",
  book: "books",
};

export const hubPath = (mediaType: LaunchMediaType): string => `/${HUB_SLUGS[mediaType]}`;

/** The medium a hub slug names, or undefined for anything else. */
export const parseHubSlug = (slug: string): LaunchMediaType | undefined =>
  launchMediaTypes.find((mediaType) => HUB_SLUGS[mediaType] === slug);
