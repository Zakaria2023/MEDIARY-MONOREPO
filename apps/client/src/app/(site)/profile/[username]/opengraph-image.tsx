import { getProfileCounts, getTasteTraits } from "services";
import { formatCount } from "utils";
import { loadProfile } from "@/lib/load-profile";
import { inlineImage } from "@/lib/server/inline-image";
import { CARD_SIZE, profileCard } from "@/lib/server/share-card";

type Props = {
  params: Promise<{ username: string }>;
};

export const alt = "A Mediary profile: the name, the handle and what they track";
export const size = CARD_SIZE;
export const contentType = "image/png";

/**
 * A PROFILE'S SHARE CARD, for a public profile: who, their counts and the
 * genres they lean on. A private profile gets a card that says only that
 * the profile exists.
 */
const ProfileOpenGraphImage = async ({ params }: Props) => {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile || !profile.access.profile) {
    return profileCard({
      name: "A Mediary profile",
      username: decodeURIComponent(username),
      line: "Anime, games, movies and TV, tracked in one place.",
      stats: [],
      avatarUrl: null,
    });
  }
  const [counts, traits, avatarUrl] = await Promise.all([
    getProfileCounts(profile.uuid),
    getTasteTraits(profile.uuid),
    profile.imageUrl ? inlineImage(profile.imageUrl) : Promise.resolve(null),
  ]);
  const leanings = traits.slice(0, 3).map((trait) => trait.name);

  return profileCard({
    name: profile.displayName,
    username: profile.username,
    line:
      leanings.length > 0
        ? `Leans ${leanings.join(", ")}.`
        : (profile.bio ?? "Anime, games, movies and TV, tracked in one place."),
    stats: [
      { label: "Titles", value: formatCount(counts.titles) },
      { label: "Completed", value: formatCount(counts.completed) },
      { label: "Hours", value: formatCount(counts.hours) },
    ],
    avatarUrl,
  });
};

export default ProfileOpenGraphImage;
