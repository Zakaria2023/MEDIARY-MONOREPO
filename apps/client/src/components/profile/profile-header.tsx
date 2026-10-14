import { CalendarDays, Link2, MapPin, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { AuthUser, isFeatureOn, PublicProfile, SocialStanding } from "services";
import { formatDate } from "utils";
import { CreatorBadge } from "@/components/creators/creator-badge";
import { CreatorViewBeacon } from "@/components/creators/creator-view-beacon";
import { FollowButton } from "@/components/profile/follow-button";
import { ProfileControls } from "@/components/profile/profile-controls";
import { ProfileLink } from "@/components/profile/profile-link";
import { UserAvatar } from "@/components/profile/user-avatar";

type ProfileHeaderProps = {
  profile: PublicProfile;
  viewer: AuthUser | null;
  /** How the viewer has set this person, for a signed-in visitor. */
  standing: SocialStanding | null;
  /** The counts, streamed in under the bio. */
  children: ReactNode;
};

/**
 * The identity area: a flat band with the avatar over its edge, the name as
 * the page's h1, the handle, the bio, the facts and the counts. The owner
 * gets a way to their settings; a signed-in visitor gets Follow and
 * Compare taste, the gradient on Compare because it is the growth loop.
 * A verified creator carries the mark beside the name, and a visit to their
 * profile and a press on their links count on their dashboard.
 */
export const ProfileHeader = ({ profile, viewer, standing, children }: ProfileHeaderProps) => {
  const isOwner = viewer?.uuid === profile.uuid;

  return (
    <section>
      {profile.creator && !isOwner && <CreatorViewBeacon userUuid={profile.uuid} kind="profile" />}
      <div className="h-28 w-full border-b border-hairline bg-surface sm:h-40" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 sm:px-8">
        <div className="-mt-12 flex items-end justify-between gap-4">
          <UserAvatar name={profile.displayName} imageUrl={profile.imageUrl} size="xl" />
          {isOwner ? (
            <Link
              href="/settings/profile"
              className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
            >
              <Settings size={16} />
              Edit profile
            </Link>
          ) : (
            viewer && (
              <div className="flex items-center gap-2">
                <ProfileControls userUuid={profile.uuid} displayName={profile.displayName} initialMuted={standing?.muted ?? false} />
                {isFeatureOn("social") && (
                  <FollowButton userUuid={profile.uuid} initialFollowing={profile.relation === "follower"} />
                )}
                {isFeatureOn("taste_match") && (
                  <Link
                    href={`/compare/${profile.username}`}
                    className="inline-flex h-10 items-center gap-2 rounded-control bg-action-gradient px-4 text-sm font-medium text-white"
                  >
                    <Sparkles size={16} />
                    Compare taste
                  </Link>
                )}
              </div>
            )
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {profile.displayName}
            </h1>
            {profile.creator && <CreatorBadge category={profile.creator} />}
          </div>
          <p className="text-sm text-muted">@{profile.username}</p>
          {profile.bio && <p className="max-w-xl pt-1 text-sm text-secondary">{profile.bio}</p>}
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {profile.location && (
            <li className="flex items-center gap-1.5">
              <MapPin size={14} />
              {profile.location}
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            Joined {formatDate(profile.joinedAt)}
          </li>
          {profile.links.map((link) => (
            <li key={link.url} className="flex items-center gap-1.5">
              <Link2 size={14} />
              <ProfileLink link={link} userUuid={profile.uuid} isCreator={profile.creator !== null} />
            </li>
          ))}
        </ul>

        {children}
      </div>
    </section>
  );
};
