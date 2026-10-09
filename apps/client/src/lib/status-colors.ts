import { TrackingStatus } from "@/db/enum";

/** One color per lifecycle state, the same on every medium: a dot, a bar, a chart. */
export const STATUS_COLOR_CLASSES: Record<TrackingStatus, string> = {
  in_progress: "bg-status-progress",
  completed: "bg-status-completed",
  paused: "bg-status-paused",
  dropped: "bg-status-dropped",
  planned: "bg-status-planned",
};
