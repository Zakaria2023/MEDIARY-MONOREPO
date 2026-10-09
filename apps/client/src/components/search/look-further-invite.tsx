import { Telescope } from "lucide-react";
import Link from "next/link";

/**
 * Under the results for a visitor: looking further brings titles into the
 * catalog for everyone, so it is a member's action; this says so and opens
 * the sign-in.
 */
export const LookFurtherInvite = () => (
  <section className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-5 sm:p-6">
    <div className="flex max-w-xl flex-col gap-1">
      <h2 className="font-display text-lg font-semibold text-ink">Not finding it?</h2>
      <p className="text-sm text-muted">
        Members can look further, in the catalogs Mediary&rsquo;s titles come from, and bring what they find in for everyone.
      </p>
    </div>
    <Link
      href="/sign-in"
      className="flex h-10 shrink-0 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
    >
      <Telescope size={16} />
      Sign in to look further
    </Link>
  </section>
);
