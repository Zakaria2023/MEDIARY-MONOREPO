import { Compass } from "lucide-react";
import Link from "next/link";
import { GuideMark } from "@/components/ask/guide-mark";

/** The guide switched off or not set up: said plainly, with another way to find something. */
export const GuideUnavailable = () => (
  <div className="flex flex-col items-start gap-5 rounded-card border border-hairline bg-surface p-6 sm:p-8">
    <GuideMark />
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-semibold text-ink">The guide isn’t available right now</h2>
      <p className="max-w-lg text-sm leading-relaxed text-muted">
        It will be back. In the meantime, Explore has what’s moving across every medium, and your home picks titles
        from what you loved.
      </p>
    </div>
    <Link
      href="/explore"
      className="flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
    >
      <Compass size={16} />
      Explore
    </Link>
  </div>
);
