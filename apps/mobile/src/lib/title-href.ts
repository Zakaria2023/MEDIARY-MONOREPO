import { Href } from "expo-router";
import { MediaType } from "@/db/enum";
import { MEDIA_TYPE_LABELS } from "@/db/label";

/** What a link to a title needs: its address on the site, which the app's route mirrors. */
type TitleAddress = {
  mediaType: MediaType;
  slug: string;
};

/** What a card's second line reads from. */
type CardFacts = {
  mediaType: MediaType;
  releaseYear: number | null;
  platformBadges: string[];
};

/** A title's screen: `/title/movie/dune`, the site's `/movie/dune` under the app's own prefix. */
export const titleHref = ({ mediaType, slug }: TitleAddress): Href => ({
  pathname: "/title/[type]/[slug]",
  params: { type: mediaType, slug },
});

/** "2021 · Movie", or a game's "2023 · PS5 · PC": what sits under a card's name. */
export const cardMeta = ({ mediaType, releaseYear, platformBadges }: CardFacts): string =>
  [
    releaseYear ? String(releaseYear) : null,
    ...(platformBadges.length > 0 ? platformBadges.slice(0, 3) : [MEDIA_TYPE_LABELS[mediaType]]),
  ]
    .filter(Boolean)
    .join(" · ");
