import { MediaSplit } from "services";
import { formatTrackedTime } from "utils";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { MEDIA_COLOR_CLASSES } from "@/lib/media-colors";

type MediaSplitBarsProps = {
  split: MediaSplit[];
};

/** A stacked bar of each medium's share of tracked time, with the legend under it. */
export const MediaSplitBars = ({ split }: MediaSplitBarsProps) => {
  const total = Math.max(1, split.reduce((sum, row) => sum + row.minutes, 0));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 w-full overflow-hidden rounded-chip bg-hairline">
        {split.map((row) => (
          <div
            key={row.mediaType}
            className={MEDIA_COLOR_CLASSES[row.mediaType]}
            style={{ width: `${(row.minutes / total) * 100}%` }}
            title={MEDIA_TYPE_PLURAL_LABELS[row.mediaType]}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {split.map((row) => (
          <li key={row.mediaType} className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${MEDIA_COLOR_CLASSES[row.mediaType]}`} />
            <span className="text-secondary">{MEDIA_TYPE_PLURAL_LABELS[row.mediaType]}</span>
            <span className="tabular ms-auto text-ink">
              {Math.round((row.minutes / total) * 100)}%
              <span className="text-muted"> · {formatTrackedTime(row.minutes)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
