import Link from "next/link";
import { PosterArt } from "@/components/media/poster-art";
import { Avatar } from "@/components/shared/avatar";
import { FEED } from "@/lib/design/mock";

/**
 * A few lines of what friends did, not an endless feed. The feed page is a
 * tab away; the home shows enough to make somebody want to open it.
 */
export const FriendsActivity = () => (
  <ul className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
    {FEED.map((item) => (
      <li key={`${item.user.username}-${item.title.slug}`} className="relative flex items-center gap-3 px-4 py-3">
        <Link
          href="/design/detail"
          aria-label={`Open ${item.title.title}`}
          className="absolute inset-0 z-10"
        />
        <Avatar user={item.user} size="sm" />
        <p className="min-w-0 flex-1 text-sm text-muted">
          <span className="font-medium text-ink">{item.user.displayName}</span>{" "}
          {item.verb}{" "}
          <span className="font-medium text-ink">{item.title.title}</span>
        </p>
        <PosterArt title={item.title} className="w-7" />
        <span className="w-6 text-end text-xs tabular text-faint">{item.when}</span>
      </li>
    ))}
  </ul>
);
