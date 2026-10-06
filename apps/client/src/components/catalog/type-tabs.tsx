import Link from "next/link";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { hubPath } from "@/lib/hub-path";

type TypeTabsProps = {
  /** The medium on screen; undefined is the All view. */
  current: LaunchMediaType | undefined;
};

/**
 * The medium switch on explore: All, then each medium. Links, not buttons,
 * so each medium's page is crawlable and has its own URL. The selected tab
 * carries the brand gradient as a selected state, one of its permitted uses.
 */
export const TypeTabs = ({ current }: TypeTabsProps) => (
  <nav aria-label="Media" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
    {[undefined, ...launchMediaTypes].map((type) => {
      const active = type === current;
      return (
        <Link
          key={type ?? "all"}
          href={type ? hubPath(type) : "/explore"}
          aria-current={active ? "page" : undefined}
          className={`flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            active
              ? "bg-brand-gradient text-white"
              : "border border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
          }`}
        >
          {type ? MEDIA_TYPE_PLURAL_LABELS[type] : "All"}
        </Link>
      );
    })}
  </nav>
);
