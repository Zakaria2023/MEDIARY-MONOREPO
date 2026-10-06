import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PosterCard } from "@/components/media/poster-card";
import { MockTitle } from "@/lib/design/mock";

type MediaRailProps = {
  title: string;
  /** A sentence under the heading: "Because you finished Frieren". */
  reason?: string;
  href?: string;
  titles: MockTitle[];
  showType?: boolean;
};

/**
 * A horizontal row of posters that scrolls sideways. The last card is cut by
 * the viewport edge on purpose: a sliced card says "there is more" better
 * than an arrow does, and the bar is hidden because the slice already says
 * it scrolls.
 */
export const MediaRail = ({
  title,
  reason,
  href,
  titles,
  showType = false,
}: MediaRailProps) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg text-ink">{title}</h2>
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
    <div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-1 sm:px-8">
      {titles.map((item) => (
        <div key={item.slug} className="w-[132px] shrink-0 sm:w-[156px]">
          <PosterCard title={item} showType={showType} />
        </div>
      ))}
    </div>
  </section>
);
