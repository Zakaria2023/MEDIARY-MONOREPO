import Link from "next/link";
import { DirectoryCreator } from "services";
import { formatCount } from "utils";
import { CreatorBadge } from "@/components/creators/creator-badge";
import { UserAvatar } from "@/components/profile/user-avatar";
import { profilePath } from "@/lib/profile-path";

type CreatorCardProps = {
  creator: DirectoryCreator;
};

/** One creator in the directory: picture, name, the mark, handle, followers and the start of the bio. The whole card opens the profile. */
export const CreatorCard = ({ creator }: CreatorCardProps) => (
  <article className="relative flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 transition-colors hover:border-hairline-strong">
    <Link
      href={profilePath(creator.username)}
      aria-label={`${creator.displayName}, @${creator.username}`}
      className="absolute inset-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    />
    <div className="flex items-center gap-3">
      <UserAvatar name={creator.displayName} imageUrl={creator.imageUrl} size="lg" />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="line-clamp-1 text-base font-medium text-ink">{creator.displayName}</h2>
        <p className="line-clamp-1 text-sm text-muted">@{creator.username}</p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <CreatorBadge category={creator.category} />
      <span className="tabular text-xs text-muted">
        {formatCount(creator.followers)} {creator.followers === 1 ? "follower" : "followers"}
      </span>
    </div>
    {creator.bio && <p className="line-clamp-3 text-sm text-secondary">{creator.bio}</p>}
  </article>
);
