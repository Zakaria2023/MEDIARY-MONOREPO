import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { DiaryLinesSkeleton } from "@/components/diary/diary-lines-skeleton";
import { DiaryPageList } from "@/components/diary/diary-page-list";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: "Your diary",
  description: "Everything you logged, in the order it happened.",
  path: "/diary",
  noIndex: true,
});

/**
 * THE DIARY: every progress event, newest first, under the day it happened.
 * Built from ProgressEvents and nothing else, so it is the history as it
 * was written, not a reconstruction.
 */
const DiaryPage = async ({ searchParams }: Props) => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  const page = Number(firstParam((await searchParams).page)) || 1;
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Your diary"
        description="Everything you logged, in the order it happened."
      />
      <AsyncSection reloadKey={`diary-${page}`} skeleton={<DiaryLinesSkeleton rows={8} />}>
        <DiaryPageList userUuid={user.uuid} page={page} />
      </AsyncSection>
    </main>
  );
};

export default DiaryPage;
