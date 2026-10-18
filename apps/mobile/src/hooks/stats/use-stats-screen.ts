import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { formatTrackedTime } from "utils";
import { trackingStatuses } from "@/db/enum";
import { GENERIC_TRACKING_STATUS_LABELS, MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { fetchStats } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

/**
 * THE STATS: everything in one read, put into the words the tiles show.
 * Time is an estimate from progress and each title's own length, as on the
 * site.
 */
export const useStatsScreen = () => {
  const { isSignedIn, getToken } = useAuth();
  const stats = useQuery({
    queryKey: queryKeys.stats,
    queryFn: async () => fetchStats(await getToken()),
    enabled: Boolean(isSignedIn),
  });
  const data = stats.data;
  const tracked = data ? trackingStatuses.reduce((sum, status) => sum + data.byStatus[status], 0) : 0;

  return {
    stats,
    isEmpty: data !== undefined && tracked === 0,
    tiles: data
      ? [
          { label: "Time tracked", value: formatTrackedTime(data.trackedMinutes) },
          { label: "Finished", value: String(data.completed) },
          { label: "Average score", value: data.averageScore === null ? "—" : data.averageScore.toFixed(1) },
          { label: "Finish rate", value: data.completionRate === null ? "—" : `${Math.round(data.completionRate)}%` },
        ]
      : [],
    statuses: data
      ? trackingStatuses.map((status) => ({
          status,
          label: GENERIC_TRACKING_STATUS_LABELS[status],
          count: data.byStatus[status],
          share: tracked > 0 ? data.byStatus[status] / tracked : 0,
        }))
      : [],
    media: (data?.byMedium ?? []).map((medium) => ({
      key: medium.mediaType,
      label: MEDIA_TYPE_PLURAL_LABELS[medium.mediaType],
      detail: `${medium.tracked} tracked · ${medium.completed} finished · ${formatTrackedTime(medium.minutes)}`,
    })),
    genres: (data?.topGenres ?? []).slice(0, 8).map((genre) => ({
      key: genre.name,
      label: genre.name,
      detail: `${genre.count} ${genre.count === 1 ? "title" : "titles"}`,
    })),
  };
};
