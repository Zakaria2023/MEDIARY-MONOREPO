import { MediaType, TrackingStatus } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { StatusDot } from "@/components/tracking/status-dot";

type EntryStatusChipProps = {
  status: TrackingStatus;
  /** Which medium's word to use: Playing, Watching, Reading. */
  mediaType: MediaType;
  size?: "sm" | "md";
};

/**
 * The tracking status, as a dot and the medium's own word for it. The stored
 * code is identical for a game and a film; only the label changes, and it
 * changes in db/label.ts and nowhere else.
 */
export const EntryStatusChip = ({ status, mediaType, size = "md" }: EntryStatusChipProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-chip border border-hairline bg-surface font-medium text-secondary ${
      size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-xs"
    }`}
  >
    <StatusDot status={status} className="h-1.5 w-1.5" />
    {TRACKING_STATUS_LABELS[mediaType][status]}
  </span>
);
