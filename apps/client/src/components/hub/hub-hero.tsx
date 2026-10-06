import Link from "next/link";
import { countCatalogByType } from "services";
import { formatCount } from "utils";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_COLOR_CLASSES, MEDIA_TEXT_CLASSES } from "@/lib/media-colors";

type HubHeroProps = {
  mediaType: LaunchMediaType;
};

/**
 * The top of a hub: a flat band with the medium's accent as a rule across
 * it, the heading as the page's h1, the intro, how big the catalog is for
 * this medium, and the way to every other hub. The accent is the one color
 * on the screen; the posters bring the rest.
 */
export const HubHero = async ({ mediaType }: HubHeroProps) => {
  const counts = await countCatalogByType();
  const copy = HUB_COPY[mediaType];
  const total = counts[mediaType] ?? 0;

  return (
    <section className="border-b border-hairline bg-surface">
      <div className={`h-1 w-full ${MEDIA_COLOR_CLASSES[mediaType]}`} />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 sm:py-12">
        <nav aria-label="Media" className="scrollbar-none -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {launchMediaTypes.map((type) => {
            const active = type === mediaType;
            return (
              <Link
                key={type}
                href={hubPath(type)}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                  active ? "bg-surface-2 text-ink" : "text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                {MEDIA_TYPE_PLURAL_LABELS[type]}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">{copy.heading}</h1>
          <p className="max-w-xl text-base text-muted sm:text-lg">{copy.intro}</p>
        </div>
        <p className="tabular text-sm text-muted">
          <span className={`font-medium ${MEDIA_TEXT_CLASSES[mediaType]}`}>{formatCount(total)}</span>{" "}
          {total === 1 ? copy.noun.replace(/s$/, "") : copy.noun} in the catalog
        </p>
      </div>
    </section>
  );
};
