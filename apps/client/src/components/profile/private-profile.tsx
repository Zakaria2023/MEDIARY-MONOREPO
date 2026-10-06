import { Lock } from "lucide-react";
import Link from "next/link";
import { PublicProfile } from "services";
import { UserAvatar } from "@/components/profile/user-avatar";

type PrivateProfileProps = {
  profile: PublicProfile;
};

/**
 * What a stranger sees of a private profile: that it exists, its name and
 * handle, and that the rest is the owner's. Never indexed; the metadata
 * says so.
 */
export const PrivateProfile = ({ profile }: PrivateProfileProps) => (
  <main className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-5 py-20 text-center">
    <UserAvatar name={profile.displayName} imageUrl={profile.imageUrl} size="xl" />
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-2xl font-semibold text-ink">{profile.displayName}</h1>
      <p className="text-sm text-muted">@{profile.username}</p>
    </div>
    <p className="flex items-center gap-2 rounded-chip border border-hairline px-3 py-1.5 text-sm text-secondary">
      <Lock size={14} className="text-muted" />
      This profile is private
    </p>
    <Link href="/explore" className="text-sm text-muted transition-colors hover:text-ink">
      Explore the catalog instead
    </Link>
  </main>
);
