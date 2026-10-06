import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { FeedPageList } from "@/components/feed/feed-page-list";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: "Your feed",
  description: "What the people you follow are watching, playing and finishing.",
  path: "/feed",
  noIndex: true,
});

/** THE FEED: what the people the viewer follows did, newest first. */
const FeedPage = async ({ searchParams }: Props) => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  const page = Number(firstParam((await searchParams).page)) || 1;
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Your feed"
        description="What the people you follow are into."
      />
      <AsyncSection reloadKey={`feed-${page}`} skeleton={<FeedSkeleton rows={8} />}>
        <FeedPageList userUuid={user.uuid} page={page} />
      </AsyncSection>
    </main>
  );
};

export default FeedPage;
