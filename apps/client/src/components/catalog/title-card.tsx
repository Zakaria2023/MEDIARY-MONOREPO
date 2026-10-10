import { Star } from "lucide-react";
import Link from "next/link";
import { CatalogCard } from "services";
import { Badge, Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { QuickTrack } from "@/components/tracking/quick-track";
import { platformBadgeLabels } from "@/lib/platform-badges";
import { titlePath } from "@/lib/title-path";

type TitleCardProps = {
  title: CatalogCard;
  /** The medium under the name: on a cross-media rail, yes; on one medium's grid, no. */
  showType?: boolean;
  /** The `sizes` of the poster in this layout. */
  sizes: string;
  /** For the first row of a page, which is above the fold. */
  priority?: boolean;
};

/**
 * THE UNIT OF EVERY GRID AND RAIL. A 2:3 poster, the name, one line of
 * metadata and the community score where there is one. The whole card is a
 * link, with the quick add on the poster above it. The hover lift is a transform, not a shadow; touch gets none of it
 * and loses nothing.
 */
export const TitleCard = ({ title, showType = false, sizes, priority = false }: TitleCardProps) => (
  <article className="group relative flex flex-col gap-2.5">
    <Link
      href={titlePath(title)}
      aria-label={title.canonicalTitle}
      className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    />
    {/* On the card, not inside the poster: the poster's hover lift is a transform, which would trap this under the link. */}
    <div className="absolute end-2 top-2 z-20">
      <QuickTrack mediaUuid={title.uuid} titleName={title.canonicalTitle} />
    </div>
    <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
      <Poster
        src={title.coverUrl}
        alt={title.canonicalTitle}
        sizes={sizes}
        dominantColor={title.dominantColor}
        priority={priority}
        className="transition-shadow duration-200 group-hover:ring-hairline-strong"
      />
    </div>
    <div className="flex min-w-0 flex-col gap-0.5">
      <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
        {title.canonicalTitle}
      </h3>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="line-clamp-1">
          {showType ? `${MEDIA_TYPE_LABELS[title.mediaType]} · ` : ""}
          {title.releaseYear ?? "TBA"}
        </span>
        {title.providerScore !== null && (
          <span className="tabular ms-auto inline-flex shrink-0 items-center gap-1 text-secondary">
            <Star size={11} className="fill-current text-warning" />
            {title.providerScore.toFixed(1)}
          </span>
        )}
      </div>
      {title.platformBadges.length > 0 && (
        <ul aria-label={`Platforms: ${title.platformBadges.join(", ")}`} className="mt-1 flex items-center gap-1 overflow-hidden">
          {platformBadgeLabels(title.platformBadges).map((label) => (
            <li key={label} aria-hidden className="shrink-0">
              <Badge>{label}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  </article>
);
