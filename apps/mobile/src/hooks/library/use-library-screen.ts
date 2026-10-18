import { useAuth } from "@clerk/expo";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { launchMediaTypes, MediaType, TrackingStatus, trackingStatuses } from "@/db/enum";
import { GENERIC_TRACKING_STATUS_LABELS, MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { formatCount } from "utils";
import { fetchLibrary, fetchLibraryCounts, LibraryQuery } from "@/lib/api";
import { nextPageOf, rowsOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";

/** One filter chip: what it sets, what it says, how many are behind it. */
type FilterOption<T> = {
  value: T;
  label: string;
  count: number;
};

/**
 * THE LIBRARY: everything the member holds, by medium and by status, the
 * most recently touched first. The status chips speak the chosen medium's
 * words ("Playing"), or the plain ones across every medium. Only media and
 * statuses that hold something get a chip.
 */
export const useLibraryScreen = () => {
  const { isSignedIn, getToken } = useAuth();
  const [mediaType, setMediaType] = useState<MediaType | undefined>(undefined);
  const [status, setStatus] = useState<TrackingStatus | undefined>(undefined);
  const query: LibraryQuery = { type: mediaType, status, sort: "updated" };

  const counts = useQuery({
    queryKey: queryKeys.libraryCounts,
    queryFn: async () => fetchLibraryCounts(await getToken()),
    enabled: Boolean(isSignedIn),
  });

  const pages = useInfiniteQuery({
    queryKey: queryKeys.libraryPage(query),
    queryFn: async ({ pageParam }) => fetchLibrary({ ...query, page: pageParam }, await getToken()),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: Boolean(isSignedIn),
  });

  const byStatus = mediaType ? counts.data?.byTypeStatus[mediaType] : counts.data?.byStatus;
  const mediaOptions: FilterOption<MediaType>[] = launchMediaTypes
    .map((value) => ({ value, label: MEDIA_TYPE_PLURAL_LABELS[value], count: counts.data?.byType[value] ?? 0 }))
    .filter((option) => option.count > 0);
  const statusOptions: FilterOption<TrackingStatus>[] = trackingStatuses
    .map((value) => ({
      value,
      label: mediaType ? TRACKING_STATUS_LABELS[mediaType][value] : GENERIC_TRACKING_STATUS_LABELS[value],
      count: byStatus?.[value] ?? 0,
    }))
    .filter((option) => option.count > 0);

  const onMediaType = (next: MediaType) => {
    setMediaType((current) => (current === next ? undefined : next));
    setStatus(undefined);
  };
  const onStatus = (next: TrackingStatus) => {
    setStatus((current) => (current === next ? undefined : next));
  };

  return {
    isSignedIn: Boolean(isSignedIn),
    pages,
    items: rowsOf(pages.data?.pages),
    /** "1 title", "48 titles", or nothing before there is one. */
    countLabel: counts.data?.all ? `${formatCount(counts.data.all)} ${counts.data.all === 1 ? "title" : "titles"}` : undefined,
    isFiltered: mediaType !== undefined || status !== undefined,
    mediaType,
    status,
    mediaOptions,
    statusOptions,
    onMediaType,
    onStatus,
    onRefresh: () => {
      void counts.refetch();
      void pages.refetch();
    },
  };
};
