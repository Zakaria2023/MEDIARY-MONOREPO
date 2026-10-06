import { CatalogCard } from "services";

/** A title's canonical path: `/movie/inception`. The only place it is built. */
export const titlePath = (title: Pick<CatalogCard, "mediaType" | "slug">): string =>
  `/${title.mediaType}/${title.slug}`;
