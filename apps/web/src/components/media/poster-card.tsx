import { Plus, Star } from "lucide-react";
import Link from "next/link";
import { PosterArt } from "@/components/media/poster-art";
import { MEDIA_TYPE_LABEL, MockTitle } from "@/lib/design/mock";

type PosterCardProps = {
  title: MockTitle;
  /** Where the card links. The prototypes all point at the detail prototype. */
  href?: string;
  /** Show the medium under the title: on a cross-media rail, yes; on a
      single-medium grid, no. */
  showType?: boolean;
};

/**
 * THE UNIT OF EVERY GRID AND RAIL. A 2:3 poster, the title, one line of
 * metadata and the community score. The whole card is a link; the add button
 * sits above it with its own z-index so a tap on the plus does not navigate.
 *
 * The hover lift is a transform, not a shadow: the card rises two pixels and
 * the poster gains a hairline ring, which is all the feedback a pointer
 * needs. Touch gets none of it and loses nothing.
 */
export const PosterCard = ({
  title,
  href = "/design/detail",
  showType = false,
}: PosterCardProps) => (
  <article className="group relative flex flex-col gap-2.5">
    <Link
      href={href}
      aria-label={`View ${title.title}`}
      className="absolute inset-0 z-10 rounded-card"
    />

    <div className="relative transition-transform duration-200 ease-out-quint group-hover:-translate-y-0.5">
      <PosterArt
        title={title}
        className="ring-0 ring-hairline-strong transition-shadow duration-200 group-hover:ring-1"
      />
      <button
        type="button"
        aria-label={`Add ${title.title} to Mediary`}
        className="absolute end-2 top-2 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-chip bg-page/80 text-ink opacity-0 backdrop-blur transition-opacity duration-150 hover:bg-primary hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Plus size={16} />
      </button>
    </div>

    <div className="flex min-w-0 flex-col gap-0.5">
      <h3 className="line-clamp-1 text-sm font-medium text-ink">{title.title}</h3>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="line-clamp-1">
          {showType ? `${MEDIA_TYPE_LABEL[title.type]} · ` : ""}
          {title.year}
        </span>
        <span className="ms-auto inline-flex shrink-0 items-center gap-1 tabular text-secondary">
          <Star size={11} className="fill-current" />
          {title.score.toFixed(1)}
        </span>
      </div>
    </div>
  </article>
);
