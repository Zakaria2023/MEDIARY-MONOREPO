import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CatalogCard } from "services";
import { Poster } from "ui";
import { formatCount } from "utils";
import { LaunchMediaType, trackingStatuses } from "@/db/enum";
import { DEFAULT_PROGRESS_UNIT, PROGRESS_UNIT_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { StatusDot } from "@/components/tracking/status-dot";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

type LandingMediaCardProps = {
  mediaType: LaunchMediaType;
  /** How many titles of the medium the catalog holds. */
  total: number;
  /** Its most followed covers, fanned beside the words; a missing one keeps its slot. */
  covers: CatalogCard[];
  /** The card that spans the full row: five covers instead of three. */
  wide?: boolean;
};

/** Each poster's turn in a fan of three, the middle one raised and on top. */
const FAN_OF_THREE = ["-rotate-6 translate-y-2", "z-10 -translate-y-1", "rotate-6 translate-y-2"];

/** A fan of five, spreading wider, the middle one on top. */
const FAN_OF_FIVE = [
  "-rotate-12 translate-y-4",
  "z-10 -rotate-6 translate-y-1",
  "z-20 -translate-y-1",
  "z-10 rotate-6 translate-y-1",
  "rotate-12 translate-y-4",
];

/**
 * One medium on the landing: its name, the unit its progress counts in and
 * how many titles Mediary holds, the five states in its own words, and its
 * most followed covers fanned beside them, lifting on hover. The whole card
 * opens the medium's hub.
 */
export const LandingMediaCard = ({ mediaType, total, covers, wide = false }: LandingMediaCardProps) => {
  const fan = wide ? FAN_OF_FIVE : FAN_OF_THREE;
  const unit = PROGRESS_UNIT_LABELS[DEFAULT_PROGRESS_UNIT[mediaType]];

  return (
    <Link
      href={hubPath(mediaType)}
      className="group relative flex h-full gap-4 overflow-hidden rounded-card border border-hairline bg-surface p-5 transition-colors sm:gap-6 sm:p-6 hover:border-hairline-strong"
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
          <ArrowUpRight size={18} className="shrink-0 text-faint transition-colors group-hover:text-ink" />
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
      <span aria-hidden className={`relative flex shrink-0 items-center justify-center ${wide ? "w-1/2 sm:w-3/5" : "w-2/5 sm:w-1/2"}`}>
        {fan.map((turn, index) => {
          const cover = covers[index];
          return (
            <span
              key={cover?.uuid ?? `slot-${index}`}
              className={`-mx-3 w-16 shrink-0 transition-transform duration-200 group-hover:-translate-y-2 sm:-mx-4 sm:w-24 lg:w-28 ${turn}`}
            >
              <Poster
                src={cover?.coverUrl ?? null}
                alt=""
                sizes="(min-width: 1024px) 112px, (min-width: 640px) 96px, 64px"
                dominantColor={cover?.dominantColor}
                className="ring-page ring-4"
              />
            </span>
          );
        })}
      </span>
    </Link>
  );
};
