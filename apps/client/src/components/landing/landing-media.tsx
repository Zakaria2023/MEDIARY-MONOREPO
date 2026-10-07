import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { countCatalogByType, listCatalogShowcase } from "services";
import { Poster } from "ui";
import { formatCount } from "utils";
import { launchMediaTypes, trackingStatuses } from "@/db/enum";
import { DEFAULT_PROGRESS_UNIT, PROGRESS_UNIT_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { StatusDot } from "@/components/tracking/status-dot";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

/** The posters fanned on the lead card, each tilted a little more. */
const FAN = ["-rotate-6 translate-y-2", "z-10 -translate-y-1", "rotate-6 translate-y-2"];

/**
 * ONE LIFECYCLE, EVERY MEDIUM IN ITS OWN WORDS: the product's central idea
 * shown, not told. Each medium's card lists the five states as that medium
 * says them, read from the same label map the app uses, with the unit its
 * progress is counted in and how much of it the catalog holds. The first
 * medium leads, two cards wide, with three of its posters fanned beside
 * its words; the rest fill the grid exactly.
 */
export const LandingMedia = async () => {
  const [lead, ...others] = launchMediaTypes;
  const [counts, showcase] = await Promise.all([
    countCatalogByType(),
    listCatalogShowcase({ sort: "top", perMedium: FAN.length, withCover: true }),
  ]);
  const fan = showcase[lead] ?? [];

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
      <LandingSectionHeading
        eyebrow="Seven media"
        title="Every medium, in its own words."
        body="A game is played, an album is listened, a book can be a DNF. Mediary speaks each one's language and keeps them all in one history."
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[lead, ...others].map((mediaType, index) => {
          const total = counts[mediaType] ?? 0;
          const unit = PROGRESS_UNIT_LABELS[DEFAULT_PROGRESS_UNIT[mediaType]];
          const leading = index === 0;
          return (
            <li key={mediaType} className={leading ? "col-span-2" : ""}>
              <Link
                href={hubPath(mediaType)}
                className="group relative flex h-full gap-6 overflow-hidden rounded-card border border-hairline bg-surface p-4 transition-colors sm:p-6 hover:border-hairline-strong"
              >
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${MEDIA_COLOR_CLASSES[mediaType]}`} />
                <span className="flex min-w-0 flex-1 flex-col gap-5 sm:gap-6">
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex flex-col gap-1">
                      <span className="font-display text-lg font-semibold text-ink sm:text-xl">{HUB_COPY[mediaType].heading}</span>
                      <span className="text-xs text-faint">
                        Counted in {unit === "%" ? "percent" : unit}
                        {total > 0 && (
                          <>
                            {" · "}
                            <span className="tabular">{formatCount(total)}</span> titles
                          </>
                        )}
                      </span>
                    </span>
                    {!leading && <ArrowUpRight size={18} className="shrink-0 text-faint transition-colors group-hover:text-ink" />}
                  </span>
                  <ul className="mt-auto flex flex-col gap-2 sm:gap-2.5">
                    {trackingStatuses.map((status) => (
                      <li key={status} className="flex items-center gap-2 text-xs text-secondary sm:gap-2.5 sm:text-sm">
                        <StatusDot status={status} />
                        {TRACKING_STATUS_LABELS[mediaType][status]}
                      </li>
                    ))}
                  </ul>
                </span>
                {leading && fan.length === FAN.length && (
                  <span aria-hidden className="relative hidden w-1/2 shrink-0 items-center justify-center sm:flex">
                    {fan.map((title, fanIndex) => (
                      <span
                        key={title.uuid}
                        className={`-mx-4 w-24 shrink-0 transition-transform duration-200 group-hover:-translate-y-2 lg:w-28 ${FAN[fanIndex] ?? ""}`}
                      >
                        <Poster src={title.coverUrl} alt="" sizes="112px" dominantColor={title.dominantColor} className="ring-page ring-4" />
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
