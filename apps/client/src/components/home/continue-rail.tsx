import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { listContinueEntries } from "services";
import { ContinueCard } from "@/components/home/continue-card";

type ContinueRailProps = {
  userUuid: string;
};

/**
 * The home's first rail for a member: what they are in the middle of, most
 * recently touched first, each with its tick. Nothing in progress, nothing
 * rendered: the trending rail under it is the invitation.
 */
export const ContinueRail = async ({ userUuid }: ContinueRailProps) => {
  const items = await listContinueEntries(userUuid);
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg text-ink sm:text-xl">Continue</h2>
          <p className="text-sm text-muted">Pick up where you left off.</p>
        </div>
        <Link
          href="/library?status=in_progress"
          className="flex shrink-0 items-center gap-0.5 text-sm text-muted transition-colors hover:text-ink"
        >
          See all
          <ChevronRight size={16} />
        </Link>
      </div>
      <div className="scrollbar-none flex snap-x gap-3 overflow-x-auto scroll-px-5 px-5 pb-1 sm:scroll-px-8 sm:px-8">
        {items.map((item) => (
          <ContinueCard key={item.entry.uuid} item={item} />
        ))}
      </div>
    </section>
  );
};
