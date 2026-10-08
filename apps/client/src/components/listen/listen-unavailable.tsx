import { Disc3 } from "lucide-react";
import Link from "next/link";

/** Song matching switched off or not set up: said plainly, with the music hub instead. */
export const ListenUnavailable = () => (
  <div className="flex w-full flex-col items-start gap-5 rounded-card border border-hairline bg-surface p-6 sm:p-8">
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-semibold text-ink">Song matching isn’t available right now</h2>
      <p className="max-w-lg text-sm leading-relaxed text-muted">
        It will be back. Until then, the music page has what people are listening to.
      </p>
    </div>
    <Link
      href="/music"
      className="flex h-10 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-hover"
    >
      <Disc3 size={16} />
      Music
    </Link>
  </div>
);
