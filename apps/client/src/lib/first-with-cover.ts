import { CatalogCard } from "services";

/** The nth title with artwork in a list, as a list of one, or an empty list. */
export const firstWithCover = (cards: CatalogCard[], skip = 0): CatalogCard[] =>
  cards.filter((card) => card.coverUrl).slice(skip, skip + 1);
