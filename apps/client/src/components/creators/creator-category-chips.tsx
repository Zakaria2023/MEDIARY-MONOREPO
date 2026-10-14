import Link from "next/link";
import { CreatorCategory, creatorCategories } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";
import { creatorsPath } from "@/lib/creators-path";

type CreatorCategoryChipsProps = {
  current: CreatorCategory | undefined;
};

const CHIP = "flex h-8 shrink-0 items-center rounded-full px-3 text-sm transition-colors";

const ACTIVE = "bg-surface-2 text-ink";

const IDLE = "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink";

/** Every kind of creator as a link, the one shown marked. */
export const CreatorCategoryChips = ({ current }: CreatorCategoryChipsProps) => (
  <nav aria-label="Kinds of creator" className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
    <Link href={creatorsPath()} aria-current={current ? undefined : "page"} className={`${CHIP} ${current ? IDLE : ACTIVE}`}>
      Everyone
    </Link>
    {creatorCategories.map((category) => (
      <Link
        key={category}
        href={creatorsPath({ category })}
        aria-current={category === current ? "page" : undefined}
        className={`${CHIP} ${category === current ? ACTIVE : IDLE}`}
      >
        {CREATOR_CATEGORY_LABELS[category]}
      </Link>
    ))}
  </nav>
);
