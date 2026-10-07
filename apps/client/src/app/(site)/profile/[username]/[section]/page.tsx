import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AsyncSection } from "ui";
import { firstParam, parseTrackingStatus } from "validators";
import { LaunchMediaType } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { PrivateProfile } from "@/components/profile/private-profile";
import { ProfileLibrary } from "@/components/profile/profile-library";
import { ProfileLibrarySkeleton } from "@/components/profile/profile-library-skeleton";
import { ProfileReviews } from "@/components/profile/profile-reviews";
import { ProfileSectionSkeleton } from "@/components/profile/profile-section-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { UserAvatar } from "@/components/profile/user-avatar";
import Link from "next/link";
import { parseHubSlug } from "@/lib/hub-path";
import { loadProfile } from "@/lib/load-profile";
import { PROFILE_LIBRARY_SLUG, PROFILE_REVIEWS_SLUG, profileLibraryPath, profilePath, profileReviewsPath } from "@/lib/profile-path";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ username: string; section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** What a section names: the whole library, one medium, the reviews, or nothing. */
const parseSection = (section: string): { kind: "library"; mediaType: LaunchMediaType | undefined } | { kind: "reviews" } | null => {
  if (section === PROFILE_LIBRARY_SLUG) {
    return { kind: "library", mediaType: undefined };
  }
  if (section === PROFILE_REVIEWS_SLUG) {
    return { kind: "reviews" };
  }
  const mediaType = parseHubSlug(section);
  return mediaType ? { kind: "library", mediaType } : null;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { username, section } = await params;
  const parsed = parseSection(section);
  const profile = await loadProfile(username);
  if (!profile || !profile.access.profile || parsed === null) {
    return { title: "Profile", robots: { index: false, follow: false } };
  }
  if (parsed.kind === "reviews") {
    return pageMetadata({
      title: `${profile.displayName}'s reviews`,
      description: `Every review ${profile.displayName} wrote on Mediary.`,
      path: profileReviewsPath(profile.username),
      noIndex: true,
    });
  }
  const what = parsed.mediaType ? MEDIA_TYPE_PLURAL_LABELS[parsed.mediaType].toLowerCase() : "library";
  return pageMetadata({
    title: `${profile.displayName}'s ${what}`,
    description: `Every ${what === "library" ? "title" : what.replace(/s$/, "")} ${profile.displayName} tracks on Mediary, by status.`,
    path: profileLibraryPath(profile.username, parsed.mediaType),
    noIndex: true,
  });
};

/**
 * SOMEONE'S LIBRARY, /@username/anime or /@username/library: their titles
 * as cards, by medium and status, in each medium's own words. What a
 * visitor sees is decided in the query by the owner's settings.
 */
const ProfileLibraryPage = async ({ params, searchParams }: Props) => {
  const { username, section } = await params;
  const parsed = parseSection(section);
  if (parsed === null) {
    notFound();
  }
  const profile = await loadProfile(username);
  if (!profile) {
    notFound();
  }
  const query = await searchParams;
  const page = Number(firstParam(query.page)) || 1;
  const owner = profile.relation === "owner";
  if (parsed.kind === "reviews") {
    if (!profile.access.profile || !profile.access.activity) {
      return <PrivateProfile profile={profile} />;
    }
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
        <Link href={profilePath(profile.username)} className="flex w-fit items-center gap-3 text-sm text-muted transition-colors hover:text-ink">
          <UserAvatar name={profile.displayName} imageUrl={profile.imageUrl} size="sm" />
          <span>
            <span className="font-medium text-ink">{profile.displayName}</span> · @{profile.username}
          </span>
        </Link>
        <SectionHeading size="page" title={owner ? "Your reviews" : `${profile.displayName}'s reviews`} description="Newest first." />
        <AsyncSection reloadKey={`${profile.uuid}-reviews-${page}`} skeleton={<ProfileSectionSkeleton posters={0} />}>
          <ProfileReviews profile={profile} page={page} />
        </AsyncSection>
      </main>
    );
  }
  const mediaType = parsed.mediaType;
  if (!profile.access.profile || !profile.access.library) {
    return <PrivateProfile profile={profile} />;
  }
  const status = parseTrackingStatus(firstParam(query.status));
  const what = mediaType ? MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase() : "library";
  const heading = status && mediaType ? TRACKING_STATUS_LABELS[mediaType][status] : owner ? `Your ${what}` : `${profile.displayName}'s ${what}`;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <Link href={profilePath(profile.username)} className="flex w-fit items-center gap-3 text-sm text-muted transition-colors hover:text-ink">
        <UserAvatar name={profile.displayName} imageUrl={profile.imageUrl} size="sm" />
        <span>
          <span className="font-medium text-ink">{profile.displayName}</span> · @{profile.username}
        </span>
      </Link>
      <SectionHeading
        size="page"
        title={heading}
        description={status && mediaType ? `${profile.displayName}'s ${what}, ${TRACKING_STATUS_LABELS[mediaType][status].toLowerCase()}.` : "By medium, and by where each title stands."}
      />
      <AsyncSection
        reloadKey={`${profile.uuid}-${mediaType ?? "all"}-${status ?? "all"}-${page}`}
        skeleton={<ProfileLibrarySkeleton />}
      >
        <ProfileLibrary profile={profile} mediaType={mediaType} status={status} page={page} />
      </AsyncSection>
    </main>
  );
};

export default ProfileLibraryPage;
