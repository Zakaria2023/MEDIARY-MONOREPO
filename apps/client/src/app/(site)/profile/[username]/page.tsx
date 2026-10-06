import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AsyncSection } from "ui";
import { PrivateProfile } from "@/components/profile/private-profile";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileCounts } from "@/components/profile/profile-counts";
import { ProfileCountsSkeleton } from "@/components/profile/profile-counts-skeleton";
import { ProfileCurrent } from "@/components/profile/profile-current";
import { ProfileFavorites } from "@/components/profile/profile-favorites";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileLists } from "@/components/profile/profile-lists";
import { ProfileSectionSkeleton } from "@/components/profile/profile-section-skeleton";
import { ProfileSplit } from "@/components/profile/profile-split";
import { DiaryLinesSkeleton } from "@/components/diary/diary-lines-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { loadProfile } from "@/lib/load-profile";
import { profilePath } from "@/lib/profile-path";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ username: string }>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile || !profile.access.profile) {
    return { title: "Profile", robots: { index: false, follow: false } };
  }
  return pageMetadata({
    title: `${profile.displayName} (@${profile.username})`,
    description:
      profile.bio ??
      `${profile.displayName} tracks anime, games, movies and TV on Mediary. See what they are watching and playing.`,
    path: profilePath(profile.username),
    image: profile.imageUrl ?? undefined,
  });
};

/**
 * A PUBLIC PROFILE, /@username. The header renders on the server with the
 * name, the handle and the bio in the HTML; the counts and every section
 * stream in behind it. Each section asks the service with the viewer's
 * standing, so what a stranger sees is decided in the query, not here.
 */
const ProfilePage = async ({ params }: Props) => {
  const { username } = await params;
  const profile = await loadProfile(username);
  if (!profile) {
    notFound();
  }
  const viewer = await getCurrentUser();

  if (!profile.access.profile) {
    return <PrivateProfile profile={profile} />;
  }

  return (
    <main className="flex flex-col">
      <ProfileHeader profile={profile} viewer={viewer}>
        <AsyncSection reloadKey={profile.uuid} skeleton={<ProfileCountsSkeleton />}>
          <ProfileCounts profile={profile} />
        </AsyncSection>
      </ProfileHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8">
        {profile.access.library && (
          <>
            <AsyncSection reloadKey={`favorites-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={6} />}>
              <ProfileFavorites profile={profile} />
            </AsyncSection>
            <AsyncSection reloadKey={`current-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={4} />}>
              <ProfileCurrent profile={profile} />
            </AsyncSection>
            <AsyncSection reloadKey={`split-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
              <ProfileSplit profile={profile} />
            </AsyncSection>
          </>
        )}
        <AsyncSection reloadKey={`lists-${profile.uuid}-${profile.relation}`} skeleton={<ProfileSectionSkeleton posters={5} />}>
          <ProfileLists profile={profile} />
        </AsyncSection>
        {profile.access.activity && (
          <AsyncSection reloadKey={`activity-${profile.uuid}`} skeleton={<DiaryLinesSkeleton rows={5} />}>
            <ProfileActivity profile={profile} />
          </AsyncSection>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
