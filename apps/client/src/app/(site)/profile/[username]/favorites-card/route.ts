import { getProfileCounts, listProfileFavorites, PRODUCT_EVENTS, track } from "services";
import { catalogImageUrl, formatCount } from "utils";
import { loadProfile } from "@/lib/load-profile";
import { favoritesCard } from "@/lib/server/share-card";

type Context = {
  params: Promise<{ username: string }>;
};

/**
 * THE FAVORITES CARD AS A FILE: a profile's hearted titles as an image to
 * share. Public when the profile and its library are; the same rule as
 * the page, asked here because an image endpoint gates itself.
 */
export const GET = async (_request: Request, context: Context): Promise<Response> => {
  const { username } = await context.params;
  const profile = await loadProfile(username);
  if (!profile || !profile.access.profile || !profile.access.library) {
    return new Response("Not found", { status: 404 });
  }
  const [favorites, counts] = await Promise.all([listProfileFavorites({ ownerUuid: profile.uuid, relation: profile.relation }), getProfileCounts(profile.uuid)]);
  if (favorites.length === 0) {
    return new Response("Nothing hearted yet", { status: 404 });
  }

  track(PRODUCT_EVENTS.shareCardGenerated, { card: "favorites" });
  return favoritesCard({
    name: profile.displayName,
    username: profile.username,
    posters: favorites.map((title) => ({
      url: title.coverUrl ? catalogImageUrl(title.coverUrl, 300) : null,
      dominantColor: title.dominantColor,
      title: title.canonicalTitle,
    })),
    stats: [
      { label: "Favorites", value: formatCount(favorites.length) },
      { label: "Titles", value: formatCount(counts.titles) },
      { label: "Completed", value: formatCount(counts.completed) },
    ],
  });
};
