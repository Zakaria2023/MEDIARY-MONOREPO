import { Compass } from "lucide-react";
import Link from "next/link";

/**
 * Where `notFound()` lands, and where a bad URL lands. Seen by a stranger
 * arriving from a search result as often as by a member, so it offers a
 * way into the product rather than only a way back.
 */
const AppNotFound = () => (
  <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-faint">
      <Compass size={22} />
    </span>
    <div className="flex flex-col gap-1.5">
      <h1 className="font-display text-xl text-ink">We couldn&apos;t find that page</h1>
      <p className="max-w-sm text-sm text-muted">
        It may have moved, or the title may not be in the catalog yet.
      </p>
    </div>
    <Link
      href="/"
      className="rounded-control bg-action-gradient px-5 py-2.5 text-sm font-medium text-white"
    >
      Go home
    </Link>
  </main>
);

export default AppNotFound;
