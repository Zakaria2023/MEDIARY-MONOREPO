import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CatalogCard } from "services";
import { TitleCard } from "@/components/catalog/title-card";

type TitleRailProps = {
  heading: string;
  /** A sentence under the heading. */
  reason?: string;
  /** Where "See all" goes. */
  href?: string;
  titles: CatalogCard[];
  showType?: boolean;
};

const RAIL_SIZES = "(min-width: 640px) 160px, 136px";

/**
 * A row of posters that scrolls sideways. The last card is cut by the edge
 * on purpose: a sliced card says "there is more" better than an arrow. A
 * rail with nothing in it is not rendered at all.
 */
export const TitleRail = ({ heading, reason, href, titles, showType = false }: TitleRailProps) =>
  titles.length === 0 ? null : (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg text-ink sm:text-xl">{heading}</h2>
          {reason && <p className="text-sm text-muted">{reason}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-ink"
          >
            See all
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      <div className="scrollbar-none flex snap-x gap-4 overflow-x-auto scroll-px-5 px-5 pb-1 sm:scroll-px-8 sm:px-8">
        {titles.map((title) => (
          <div key={title.uuid} className="w-34 shrink-0 snap-start sm:w-40">
            <TitleCard title={title} showType={showType} sizes={RAIL_SIZES} />
          </div>
        ))}
      </div>
    </section>
  );
