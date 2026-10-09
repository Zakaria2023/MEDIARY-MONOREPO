import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSocialStanding, PRODUCT_EVENTS, track } from "services";
import { AsyncSection } from "ui";
import { PrivateProfile } from "@/components/profile/private-profile";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileBreakdown } from "@/components/profile/profile-breakdown";
import { ProfileCounts } from "@/components/profile/profile-counts";
import { ProfileCountsSkeleton } from "@/components/profile/profile-counts-skeleton";
import { ProfileCurrent } from "@/components/profile/profile-current";
import { ProfileFavorites } from "@/components/profile/profile-favorites";
import { ProfileFeaturedReview } from "@/components/profile/profile-featured-review";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileLists } from "@/components/profile/profile-lists";
import { ProfileMilestones } from "@/components/profile/profile-milestones";
import { ProfileReviews } from "@/components/profile/profile-reviews";
import { ProfileSectionSkeleton } from "@/components/profile/profile-section-skeleton";
import { ProfileSplit } from "@/components/profile/profile-split";
import { ProfileTaste } from "@/components/profile/profile-taste";
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
    ownImage: true,
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
  const standing = viewer && viewer.uuid !== profile.uuid ? await getSocialStanding(viewer.uuid, profile.uuid) : null;
  track(PRODUCT_EVENTS.profileViewed, { own: profile.relation === "owner", member: viewer !== null, open: profile.access.profile });

  if (!profile.access.profile) {
    return <PrivateProfile profile={profile} />;
  }

  return (
    <main className="flex flex-col">
      <ProfileHeader profile={profile} viewer={viewer} standing={standing}>
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
            <AsyncSection reloadKey={`breakdown-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
              <ProfileBreakdown profile={profile} />
            </AsyncSection>
            <AsyncSection reloadKey={`current-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={4} />}>
              <ProfileCurrent profile={profile} />
            </AsyncSection>
            <AsyncSection reloadKey={`milestones-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
              <ProfileMilestones profile={profile} />
            </AsyncSection>
            <div className="grid gap-6 lg:grid-cols-2">
              <AsyncSection reloadKey={`taste-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
                <ProfileTaste profile={profile} />
              </AsyncSection>
              <AsyncSection reloadKey={`split-${profile.uuid}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
                <ProfileSplit profile={profile} />
              </AsyncSection>
            </div>
          </>
        )}
        <AsyncSection reloadKey={`featured-${profile.uuid}-${profile.relation}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
          <ProfileFeaturedReview profile={profile} />
        </AsyncSection>
        <AsyncSection reloadKey={`lists-${profile.uuid}-${profile.relation}`} skeleton={<ProfileSectionSkeleton posters={5} />}>
          <ProfileLists profile={profile} />
        </AsyncSection>
        <AsyncSection reloadKey={`reviews-${profile.uuid}-${profile.relation}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
          <ProfileReviews profile={profile} page={null} />
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
