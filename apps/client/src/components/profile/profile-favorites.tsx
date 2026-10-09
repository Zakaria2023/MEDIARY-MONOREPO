import { Download } from "lucide-react";
import { listProfileFavorites, PublicProfile } from "services";
import { TitleCard } from "@/components/catalog/title-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { profilePath } from "@/lib/profile-path";

type ProfileFavoritesProps = {
  profile: PublicProfile;
};

const FAVORITE_SIZES = "(min-width: 640px) 200px, 33vw";

/**
 * The titles the owner hearted, six across. Nothing hearted yet, nothing
 * shown: an empty favorites strip would only say "not much here".
 */
export const ProfileFavorites = async ({ profile }: ProfileFavoritesProps) => {
  const favorites = await listProfileFavorites({ ownerUuid: profile.uuid, relation: profile.relation });
  if (favorites.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Favorites"
        description="The ones that define the taste."
        action={
          <a
            href={`${profilePath(profile.username)}/favorites-card`}
            download={`mediary-${profile.username}-favorites.png`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
          >
            <Download size={14} />
            Save as image
          </a>
        }
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
        {favorites.map((title) => (
          <TitleCard key={title.uuid} title={title} showType sizes={FAVORITE_SIZES} />
        ))}
      </div>
    </section>
  );
};
