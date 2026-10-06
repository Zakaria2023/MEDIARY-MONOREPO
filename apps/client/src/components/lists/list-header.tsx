import { Lock, Users } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { ListDetail } from "services";
import { formatCount, formatDate } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { profilePath } from "@/lib/profile-path";

type ListHeaderProps = {
  list: ListDetail;
  /** The owner's buttons, on the end edge. */
  actions?: ReactNode;
};

/** The top of a list page: name as the h1, description, the owner, count, visibility. */
export const ListHeader = ({ list, actions }: ListHeaderProps) => (
  <header className="flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{list.name}</h1>
        {list.description && <p className="max-w-2xl text-base text-secondary">{list.description}</p>}
      </div>
      {actions}
    </div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
      {list.owner.username ? (
        <Link
          href={profilePath(list.owner.username)}
          className="flex items-center gap-2 text-secondary transition-colors hover:text-ink"
        >
          <UserAvatar name={list.owner.displayName} imageUrl={list.owner.imageUrl} size="sm" />
          {list.owner.displayName}
        </Link>
      ) : (
        <span className="flex items-center gap-2">
          <UserAvatar name={list.owner.displayName} imageUrl={list.owner.imageUrl} size="sm" />
          {list.owner.displayName}
        </span>
      )}
      <span>
        {formatCount(list.itemCount)} {list.itemCount === 1 ? "title" : "titles"}
      </span>
      <span>Updated {formatDate(list.updatedAt)}</span>
      {list.visibility === "private" && (
        <span className="flex items-center gap-1.5">
          <Lock size={14} />
          Only you
        </span>
      )}
      {list.visibility === "followers" && (
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          Followers only
        </span>
      )}
    </div>
  </header>
);
