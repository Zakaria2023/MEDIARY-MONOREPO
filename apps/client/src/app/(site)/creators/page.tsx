import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { CreatorCategory, creatorCategories } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";
import { CreatorCategoryChips } from "@/components/creators/creator-category-chips";
import { CreatorsGrid } from "@/components/creators/creators-grid";
import { CreatorsGridSkeleton } from "@/components/creators/creators-grid-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { creatorsPath } from "@/lib/creators-path";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const parseCategory = (value: string | undefined): CreatorCategory | undefined =>
  creatorCategories.find((category) => category === value);

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => {
  const params = await searchParams;
  const category = parseCategory(firstParam(params.category));
  const page = Number(firstParam(params.page)) || 1;
  const noun = category ? `${CREATOR_CATEGORY_LABELS[category]}s` : "Creators";
  return pageMetadata({
    title: page > 1 ? `${noun} on Mediary, page ${page}` : `${noun} on Mediary`,
    description:
      "Verified video creators, streamers, critics and writers on Mediary. See what they watch, play and read, follow their lists, and compare your taste with theirs.",
    path: creatorsPath({ category, page }),
  });
};

/**
 * CREATORS: every verified creator who chose to be listed, the most followed
 * first, by kind. Staff checked each one's channels, and nobody pays to be
 * here or to be verified. The heading and the kinds are in the first bytes;
 * the grid streams in.
 */
const CreatorsPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const category = parseCategory(firstParam(params.category));
  const page = Number(firstParam(params.page)) || 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Creators"
        description="People who make videos, stream, write and review, verified by Mediary's staff. Follow their lists, or see how your taste compares."
      />
      <CreatorCategoryChips current={category} />
      <AsyncSection reloadKey={`creators-${category ?? "all"}-${page}`} skeleton={<CreatorsGridSkeleton />}>
        <CreatorsGrid category={category} page={page} />
      </AsyncSection>
    </main>
  );
};

export default CreatorsPage;
