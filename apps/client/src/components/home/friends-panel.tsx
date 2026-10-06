import Link from "next/link";
import { listFeed } from "services";
import { FeedLine } from "@/components/feed/feed-line";
import { SectionHeading } from "@/components/shared/section-heading";

type FriendsPanelProps = {
  userUuid: string;
};

/**
 * A few lines of what friends did, not an endless feed. The feed page is a
 * link away; the home shows enough to make somebody want to open it.
 * Nothing to show, nothing rendered.
 */
export const FriendsPanel = async ({ userUuid }: FriendsPanelProps) => {
  const feed = await listFeed(userUuid, { pageSize: 6 });
  if (feed.total === 0) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 sm:px-8">
      <SectionHeading
        title="Friends"
        description="What they are into."
        action={
          <Link href="/feed" className="text-sm text-muted transition-colors hover:text-ink">
            Open your feed
          </Link>
        }
      />
      <ol className="flex flex-col divide-y divide-hairline-soft rounded-card border border-hairline bg-surface">
        {feed.items.map((item) => (
          <FeedLine key={item.uuid} item={item} />
        ))}
      </ol>
    </section>
  );
};
