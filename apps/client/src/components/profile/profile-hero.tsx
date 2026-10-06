import { Share2, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "ui";
import { Avatar } from "@/components/shared/avatar";
import { MockUser } from "@/lib/design/mock";

type ProfileHeroProps = {
  user: MockUser;
  /** Whether the viewer is looking at somebody else. */
  isOther: boolean;
};

const COUNTS: [string, string][] = [
  ["Titles", "214"],
  ["Hours", "1,204"],
  ["Followers", "86"],
  ["Following", "52"],
];

/**
 * The identity area: banner, avatar, name, handle, bio, counts and the two
 * actions. Compare Taste is prominent when viewing another profile because
 * it is the product's growth loop; on your own it becomes Share.
 */
export const ProfileHero = ({ user, isOther }: ProfileHeroProps) => (
  <section className="relative">
    {/* The banner: the user's upload once they have one, their color until
        then, with the same fade into the page the detail hero uses. */}
    <div className="relative h-36 w-full sm:h-52" style={{ backgroundColor: user.color }}>
      <div className="absolute inset-0 bg-page/40" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-backdrop-fade" />
    </div>
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 sm:px-8">
      <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-14">
        <Avatar user={user} size="xl" />
        <div className="flex items-center gap-2 pb-1">
          {isOther ? (
            <>
              <Button variant="outline">
                <UserPlus size={16} />
                Follow
              </Button>
              <Link
                href="/design/compare"
                className="inline-flex h-10 items-center gap-2 rounded-control bg-brand-gradient px-4 text-sm font-medium text-white"
              >
                <Sparkles size={16} />
                Compare taste
              </Link>
            </>
          ) : (
            <Button variant="outline">
              <Share2 size={16} />
              Share
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-ink">{user.displayName}</h1>
        <p className="text-sm text-muted">@{user.username}</p>
        <p className="max-w-xl pt-1 text-sm text-secondary">
          Slow burns, long games, anything with a time skip. Currently losing
          to Elden Ring and winning at Frieren.
        </p>
      </div>

      <dl className="flex flex-wrap gap-6">
        {COUNTS.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dd className="tabular font-display text-lg font-semibold text-ink">{value}</dd>
            <dt className="text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </div>
  </section>
);
