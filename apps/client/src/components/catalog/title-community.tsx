import { Heart } from "lucide-react";
import { getTitleCommunity } from "services";
import { formatCount } from "utils";
import { MediaType, trackingStatuses } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { RatingDistribution } from "@/components/media/rating-distribution";
import { StatusDot } from "@/components/tracking/status-dot";
import { STATUS_COLOR_CLASSES } from "@/lib/status-colors";

type TitleCommunityProps = {
  mediaUuid: string;
  mediaType: MediaType;
  /** The viewer's own score, lit in the distribution. */
  viewerScore: number | null;
};

/**
 * WHAT MEMBERS DO WITH IT: how many track the title, split by state in the
 * medium's own words, how many hearted it, and the shape of their scores
 * with the viewer's own lit. Counts only; nobody is named here.
 */
export const TitleCommunity = async ({ mediaUuid, mediaType, viewerScore }: TitleCommunityProps) => {
  const community = await getTitleCommunity(mediaUuid);

  return (
    <section aria-labelledby="title-community-heading" className="flex flex-col gap-3">
      <h2 id="title-community-heading" className="text-xs font-medium uppercase tracking-wide text-faint">
        Members
      </h2>
      {community.members === 0 ? (
        <p className="text-sm text-muted">No one on Mediary tracks this yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>
                <span className="tabular font-medium text-ink">{formatCount(community.members)}</span>{" "}
                {community.members === 1 ? "member tracks it" : "members track it"}
              </span>
              {community.favorites > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Heart size={13} className="fill-current text-pink" />
                  <span className="tabular text-ink">{formatCount(community.favorites)}</span> hearted
                </span>
              )}
            </p>
            <ul className="flex flex-col gap-2.5">
              {trackingStatuses.map((status) => {
                const entries = community.statuses[status];
                return (
                  <li key={status} className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-sm">
                      <StatusDot status={status} />
                      <span className="flex-1 text-secondary">{TRACKING_STATUS_LABELS[mediaType][status]}</span>
                      <span className="tabular text-ink">{formatCount(entries)}</span>
                    </span>
                    <span className="h-1 overflow-hidden rounded-full bg-hover">
                      <span
                        className={`block h-full rounded-full ${STATUS_COLOR_CLASSES[status]}`}
                        style={{ width: `${(entries / community.members) * 100}%` }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
            <p className="text-sm text-muted">
              {community.scored === 0 ? (
                "No one has scored it yet."
              ) : (
                <>
                  Scored by <span className="tabular font-medium text-ink">{formatCount(community.scored)}</span>
                  {viewerScore !== null && ", yours lit"}
                </>
              )}
            </p>
            {community.scored > 0 && (
              <RatingDistribution
                counts={community.scores}
                highlight={viewerScore === null ? null : Math.round(viewerScore)}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
