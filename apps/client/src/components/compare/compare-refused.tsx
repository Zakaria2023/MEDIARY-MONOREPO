import { Lock } from "lucide-react";
import Link from "next/link";
import { SocialUser, TasteMatchRefusal } from "services";
import { UserAvatar } from "@/components/profile/user-avatar";
import { profilePath } from "@/lib/profile-path";

type CompareRefusedProps = {
  other: SocialUser;
  reason: TasteMatchRefusal;
};

/** What the viewer sees when the other person keeps comparisons to their followers, or to no one. */
export const CompareRefused = ({ other, reason }: CompareRefusedProps) => (
  <main className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-20 text-center">
    <UserAvatar name={other.displayName} imageUrl={other.imageUrl} size="xl" />
    <h1 className="font-display text-2xl font-semibold text-ink">{other.displayName}</h1>
    <p className="flex items-center gap-2 rounded-chip border border-hairline px-3 py-1.5 text-sm text-secondary">
      <Lock size={14} className="text-muted" />
      {reason === "followers"
        ? "Compares taste with followers only"
        : "Does not compare taste"}
    </p>
    {other.username && (
      <Link href={profilePath(other.username)} className="text-sm text-muted transition-colors hover:text-ink">
        {reason === "followers" ? "Follow them from their profile, then come back" : "Back to their profile"}
      </Link>
    )}
  </main>
);
