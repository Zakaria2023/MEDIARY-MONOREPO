import { Plus, Star } from "lucide-react";
import { CatalogCard } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { DemoFrame } from "@/components/landing/demo-frame";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StatusDot } from "@/components/tracking/status-dot";

type TrackDemoProps = {
  /** The titles the still shows, the first one large. */
  titles: CatalogCard[];
};

const WATCHED = 18;
const EPISODES = 24;

/**
 * A still of tracking: the title in the middle of being watched with its
 * progress and the one-tap step, and two more in the library behind it in
 * their own states.
 */
export const TrackDemo = ({ titles }: TrackDemoProps) => {
  const [lead, ...rest] = titles;
  if (!lead) {
    return null;
  }

  return (
    <DemoFrame caption="An example library">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 rounded-card border border-hairline-strong bg-overlay p-4 sm:gap-5 sm:p-5">
          <div className="w-24 shrink-0 sm:w-28">
            <Poster src={lead.coverUrl} alt="" sizes="112px" dominantColor={lead.dominantColor} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="line-clamp-2 font-display text-lg font-semibold text-ink">{lead.canonicalTitle}</span>
              <span className="text-xs text-muted">
                {MEDIA_TYPE_LABELS[lead.mediaType]}
                {lead.releaseYear && ` · ${lead.releaseYear}`}
              </span>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-chip bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
              <StatusDot status="in_progress" />
              {TRACKING_STATUS_LABELS[lead.mediaType].in_progress}
            </span>
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="tabular text-secondary">
                  Episode {WATCHED} of {EPISODES}
                </span>
                <span className="tabular text-faint">{Math.round((WATCHED / EPISODES) * 100)}%</span>
              </div>
              <ProgressBar value={WATCHED} total={EPISODES} />
            </div>
          </div>
          <span className="inline-flex h-10 shrink-0 items-center gap-1 self-end rounded-control bg-action-gradient px-3 text-sm font-medium text-white">
            <Plus size={16} />1
          </span>
        </div>

        {rest.slice(0, 2).map((title, index) => (
          <div key={title.uuid} className="flex items-center gap-4 rounded-card border border-hairline bg-surface-2 p-3 opacity-90">
            <div className="w-12 shrink-0">
              <Poster src={title.coverUrl} alt="" sizes="48px" radius="control" dominantColor={title.dominantColor} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="line-clamp-1 text-sm font-medium text-ink">{title.canonicalTitle}</span>
              <span className="inline-flex items-center gap-2 text-xs text-muted">
                <StatusDot status={index === 0 ? "completed" : "planned"} />
                {TRACKING_STATUS_LABELS[title.mediaType][index === 0 ? "completed" : "planned"]}
              </span>
            </div>
            {index === 0 && (
              <span className="tabular inline-flex items-center gap-1 text-sm text-ink">
                <Star size={13} className="fill-current text-warning" />
                9.0
              </span>
            )}
          </div>
        ))}
      </div>
    </DemoFrame>
  );
};
