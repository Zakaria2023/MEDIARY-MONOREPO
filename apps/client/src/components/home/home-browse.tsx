import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { countCatalogByType } from "services";
import { formatCount } from "utils";
import { launchMediaTypes } from "@/db/enum";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

/**
 * THE WAY INTO EVERY MEDIUM from the home: one tile per hub with its
 * accent as a rule, its intro line and how big its catalog is. A medium
 * with nothing imported yet is not offered.
 */
export const HomeBrowse = async () => {
  const counts = await countCatalogByType();
  const media = launchMediaTypes.filter((mediaType) => (counts[mediaType] ?? 0) > 0);
  if (media.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 px-5 sm:px-8">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg text-ink sm:text-xl">Browse by medium</h2>
        <p className="text-sm text-muted">Each one has its own page, its own filters and its own way of being tracked.</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((mediaType) => {
          const copy = HUB_COPY[mediaType];
          const total = counts[mediaType] ?? 0;
          return (
            <li key={mediaType}>
              <Link
                href={hubPath(mediaType)}
                className="group flex h-full flex-col gap-3 overflow-hidden rounded-card border border-hairline bg-surface transition-colors hover:border-hairline-strong"
              >
                <span className={`h-1 w-full ${MEDIA_COLOR_CLASSES[mediaType]}`} />
                <span className="flex flex-1 flex-col gap-1 px-4 pb-4">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-base text-ink">{copy.heading}</span>
                    <ChevronRight size={16} className="text-faint transition-colors group-hover:text-ink" />
                  </span>
                  <span className="line-clamp-2 text-xs text-muted">{copy.intro}</span>
                  <span className="tabular mt-auto pt-2 text-xs text-faint">
                    {formatCount(total)} {total === 1 ? copy.noun.replace(/s$/, "") : copy.noun}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
