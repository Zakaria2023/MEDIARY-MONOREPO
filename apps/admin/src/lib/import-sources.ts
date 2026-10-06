import { MediaType, Provider } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { ProviderStatus } from "services";

/** One thing the import screen can pull from: a provider and a medium. */
export type ImportSource = {
  /** "tmdb:movie", the Dropdown's value. */
  value: string;
  label: string;
  provider: Provider;
  mediaType: MediaType;
  configured: boolean;
};

/** Every provider and medium pair, in the order the registry lists them. */
export const importSources = (statuses: ProviderStatus[]): ImportSource[] =>
  statuses.flatMap((status) =>
    status.mediaTypes.map((mediaType) => ({
      value: `${status.provider}:${mediaType}`,
      label: `${status.name} · ${MEDIA_TYPE_PLURAL_LABELS[mediaType]}`,
      provider: status.provider,
      mediaType,
      configured: status.configured,
    })),
  );
