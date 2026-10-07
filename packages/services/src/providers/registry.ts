import { MediaType, Provider } from "../../../../db/enum";
import { PROVIDER_LABELS } from "../../../../db/label";
import { igdbProvider } from "./igdb";
import { kitsuProvider } from "./kitsu";
import { musicbrainzProvider } from "./musicbrainz";
import { openLibraryProvider } from "./openlibrary";
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
 * EVERY CATALOG SOURCE MEDIARY CAN IMPORT FROM. Anime and manga come from Kitsu, books from Open Library;
 * AniList is ruled out by its terms (docs/catalog-providers.md). Adding a
 * source is one adapter and one line here.
 */
const ADAPTERS: MediaProvider[] = [tmdbProvider, igdbProvider, kitsuProvider, musicbrainzProvider, openLibraryProvider];

/** The adapter for a provider, or an error naming what is missing. */
export const getProvider = (provider: Provider): MediaProvider => {
  const adapter = ADAPTERS.find((entry) => entry.provider === provider);
  if (!adapter) {
    throw new Error(`There is no ${provider} adapter`);
  }
  return adapter;
};

/** The adapter that supplies a medium, or null when none does yet. */
export const providerForType = (mediaType: MediaType): MediaProvider | null =>
  ADAPTERS.find((entry) => entry.mediaTypes.includes(mediaType)) ?? null;

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
