import { TrackingStatus } from "@/db/enum";
import { STATUS_COLOR_CLASSES } from "@/lib/status-colors";

type StatusDotProps = {
  status: TrackingStatus;
  className?: string;
};

export const StatusDot = ({ status, className = "h-2 w-2" }: StatusDotProps) => (
  <span
    aria-hidden="true"
    className={`inline-block shrink-0 rounded-full ${STATUS_COLOR_CLASSES[status]} ${className}`}
  />
);
