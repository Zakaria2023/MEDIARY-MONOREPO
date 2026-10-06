import { MockMediaType, MockStatus, STATUS_LABEL } from "@/lib/design/mock";

type StatusChipProps = {
  status: MockStatus;
  /** Which medium's word to use: Playing, Watching, Reading. */
  type: MockMediaType;
  size?: "sm" | "md";
};

/** One color per lifecycle state, the same on every medium. */
const DOT_CLASSES: Record<MockStatus, string> = {
  in_progress: "bg-status-progress",
  completed: "bg-status-completed",
  paused: "bg-status-paused",
  dropped: "bg-status-dropped",
  planned: "bg-status-planned",
};

/**
 * The tracking status, as a dot and the medium's own word for it. The stored
 * code is identical for a game and a film; only the label changes, and it
 * changes HERE and nowhere else.
 */
export const StatusChip = ({ status, type, size = "md" }: StatusChipProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-chip border border-hairline bg-surface font-medium text-secondary ${
      size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-xs"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[status]}`} />
    {STATUS_LABEL[type][status]}
  </span>
);
