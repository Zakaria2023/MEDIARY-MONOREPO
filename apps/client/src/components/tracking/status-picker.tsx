"use client";

import { MediaType, TrackingStatus, trackingStatuses } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { StatusDot } from "@/components/tracking/status-dot";

type StatusPickerProps = {
  mediaType: MediaType;
  value: TrackingStatus;
  onChange: (status: TrackingStatus) => void;
};

/**
 * The five statuses as big targets, two across, the medium's own words on
 * them. First in the sheet because for most saves it is the whole save.
 */
export const StatusPicker = ({ mediaType, value, onChange }: StatusPickerProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">Status</legend>
    <div className="grid grid-cols-2 gap-2">
      {trackingStatuses.map((status) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(status)}
            className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-control border px-3 text-sm font-medium transition-colors ${
              selected
                ? "border-accent bg-accent-tint text-ink"
                : "border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
            }`}
          >
            <StatusDot status={status} />
            {TRACKING_STATUS_LABELS[mediaType][status]}
          </button>
        );
      })}
    </div>
  </fieldset>
);
