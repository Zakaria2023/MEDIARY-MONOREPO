import { TrackingStatus } from "@/db/enum";

type StatusDotProps = {
  status: TrackingStatus;
  className?: string;
};

/** One color per lifecycle state, the same on every medium. */
const DOT_CLASSES: Record<TrackingStatus, string> = {
  in_progress: "bg-status-progress",
  completed: "bg-status-completed",
  paused: "bg-status-paused",
  dropped: "bg-status-dropped",
  planned: "bg-status-planned",
};

export const StatusDot = ({ status, className = "h-2 w-2" }: StatusDotProps) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 rounded-full ${DOT_CLASSES[status]} ${className}`}
  />
);
