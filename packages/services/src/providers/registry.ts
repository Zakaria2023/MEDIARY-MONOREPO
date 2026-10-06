import { MediaType, Provider } from "../../../../db/enum";
import { igdbProvider } from "./igdb";
import { tmdbProvider } from "./tmdb";
import { MediaProvider, ProviderAttribution } from "./types";

/** What the admin shows about a source: whether it can be used yet. */
export type ProviderStatus = {
  provider: Provider;
  name: string;
  mediaTypes: readonly MediaType[];
  configured: boolean;
  /** The environment variables it reads, for the "not configured" hint. */
  envVars: string[];
};

/**
 * EVERY CATALOG SOURCE MEDIARY CAN IMPORT FROM. Anime has no entry: AniList
 * is ruled out by its terms and the replacement is the owner's decision
 * (docs/catalog-providers.md). Adding it is one adapter and one line here.
 */
const ADAPTERS: MediaProvider[] = [tmdbProvider, igdbProvider];

const ENV_VARS: Partial<Record<Provider, string[]>> = {
  tmdb: ["TMDB_READ_ACCESS_TOKEN"],
  igdb: ["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET"],
};

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
    name: adapter.attribution.name,
    mediaTypes: adapter.mediaTypes,
    configured: adapter.isConfigured(),
    envVars: ENV_VARS[adapter.provider] ?? [],
  }));

/** The attribution each of the given providers requires, adapters only. */
export const attributionsFor = (providers: Provider[]): ProviderAttribution[] =>
  ADAPTERS.filter((adapter) => providers.includes(adapter.provider)).map(
    (adapter) => adapter.attribution,
  );

/** Every adapter's attribution, for the site footer. */
export const allAttributions = (): ProviderAttribution[] =>
  ADAPTERS.map((adapter) => adapter.attribution);
