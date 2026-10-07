import { CatalogCard } from "services";

/** A title's canonical path: `/movie/inception`. The only place it is built. */
export const titlePath = (title: Pick<CatalogCard, "mediaType" | "slug">): string =>
  `/${title.mediaType}/${title.slug}`;

/** A review's share card, under its title's address. */
export const reviewCardPath = (title: Pick<CatalogCard, "mediaType" | "slug">, reviewUuid: string): string =>
  `${titlePath(title)}/review-card?review=${reviewUuid}`;
