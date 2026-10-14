import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { listCreators } from "services";
import { Pagination } from "ui";
import { CreatorCategory } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";
import { CreatorCard } from "@/components/creators/creator-card";
import { JsonLd } from "@/components/seo/json-ld";
import { creatorsPath } from "@/lib/creators-path";
import { creatorListNode, graph } from "@/lib/structured-data";

type CreatorsGridProps = {
  category: CreatorCategory | undefined;
  page: number;
};

/** One across on a phone, three on a wide screen. */
export const CREATORS_GRID_CLASSES = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** A page of verified creators, the most followed first, or the sentence for none. */
export const CreatorsGrid = async ({ category, page }: CreatorsGridProps) => {
  const result = await listCreators({ category, page });

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <BadgeCheck size={28} className="text-faint" />
        <p className="text-base font-medium text-ink">
          {category ? `No ${CREATOR_CATEGORY_LABELS[category].toLowerCase()}s here yet` : "No creators here yet"}
        </p>
        <p className="max-w-sm text-sm text-muted">
          Creators appear once staff have checked their channels. Make videos, stream, write or review? Ask to be verified.
        </p>
        <Link href="/studio" className="text-sm font-medium text-accent hover:text-accent-hover">
          Ask to be a verified creator
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <JsonLd data={graph([creatorListNode(creatorsPath({ category, page }), result.items)])} />
      <div className={CREATORS_GRID_CLASSES}>
        {result.items.map((creator) => (
          <CreatorCard key={creator.uuid} creator={creator} />
        ))}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => creatorsPath({ category, page: next })} />
    </div>
  );
};
