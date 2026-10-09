import { MediaType, Provider } from "../../../../db/enum";
import { PROVIDER_LABELS } from "../../../../db/label";
import { igdbProvider } from "./igdb";
import { kitsuProvider } from "./kitsu";
import { musicbrainzProvider } from "./musicbrainz";
import { openLibraryProvider } from "./openlibrary";
import { steamProvider } from "./steam";
import { tmdbProvider } from "./tmdb";
import { MediaProvider, ProviderAttribution } from "./types";

/** What the admin shows about a source: whether it can be used yet. */
export type ProviderStatus = {
  provider: Provider;
  /** The descriptive label from PROVIDER_LABELS; never the vendor's name. */
  name: string;
  mediaTypes: readonly MediaType[];
  configured: boolean;
};

/**
 * EVERY CATALOG SOURCE MEDIARY CAN IMPORT FROM. Games come from the Steam store until IGDB's keys are set; anime and manga from Kitsu, books from Open Library;
 * AniList is ruled out by its terms (docs/catalog-providers.md). Adding a
 * source is one adapter and one line here.
 */
const ADAPTERS: MediaProvider[] = [
  tmdbProvider,
  igdbProvider,
  steamProvider,
  kitsuProvider,
  musicbrainzProvider,
  openLibraryProvider,
];

/** The adapter for a provider, or an error naming what is missing. */
export const getProvider = (provider: Provider): MediaProvider => {
  const adapter = ADAPTERS.find((entry) => entry.provider === provider);
  if (!adapter) {
    throw new Error(`There is no ${provider} adapter`);
  }
  return adapter;
};

/**
 * The adapter that supplies a medium: the first one listed whose keys are
 * present, so games come from the game database once its keys are set and
 * from the game store until then. Null when none supplies the medium.
 */
export const providerForType = (mediaType: MediaType): MediaProvider | null =>
  ADAPTERS.find((entry) => entry.mediaTypes.includes(mediaType) && entry.isConfigured()) ??
  ADAPTERS.find((entry) => entry.mediaTypes.includes(mediaType)) ??
  null;

/** Every adapter that supplies a medium, in the order listed. */
export const providersForType = (mediaType: MediaType): MediaProvider[] =>
  ADAPTERS.filter((entry) => entry.mediaTypes.includes(mediaType));

/** Every source with whether its credentials are present. */
export const listProviderStatuses = (): ProviderStatus[] =>
  ADAPTERS.map((adapter) => ({
    provider: adapter.provider,
    name: PROVIDER_LABELS[adapter.provider],
    mediaTypes: adapter.mediaTypes,
    configured: adapter.isConfigured(),
  }));

/** The credit every source asks for, for the one page that names them. */
export const listProviderAttributions = (): ProviderAttribution[] => ADAPTERS.map((adapter) => adapter.attribution);
