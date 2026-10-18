import { useAuth } from "@clerk/expo";
import { useInfiniteQuery } from "@tanstack/react-query";
import { diaryDay, diaryDayHeading } from "services/pure";
import { fetchDiary } from "@/lib/api";
import { DiaryLine } from "@/lib/api-types";
import { deviceZone } from "@/lib/device-zone";
import { nextPageOf, rowsOf } from "@/lib/pages";
import { queryKeys } from "@/lib/query-keys";

/** One day of the diary: its heading and its moments, newest first. */
type DiaryDay = {
  day: string;
  title: string;
  data: DiaryLine[];
};

/** Moments grouped under the day they happened on, in the member's zone, in the order they came. */
const groupByDay = (lines: DiaryLine[], zone: string): DiaryDay[] => {
  const days: DiaryDay[] = [];
  for (const line of lines) {
    const day = diaryDay(new Date(line.eventAt), zone);
    const last = days[days.length - 1];
    if (last && last.day === day) {
      last.data.push(line);
    } else {
      days.push({ day, title: diaryDayHeading(day), data: [line] });
    }
  }
  return days;
};

/**
 * THE DIARY: every moment the member logged, newest first, under the day it
 * happened on. Read from the history the tracking writer keeps, never
 * pieced together from the library as it is now.
 */
export const useDiaryScreen = () => {
  const { isSignedIn, getToken } = useAuth();
  const zone = deviceZone();
  const pages = useInfiniteQuery({
    queryKey: queryKeys.diary,
    queryFn: async ({ pageParam }) => fetchDiary(pageParam, await getToken()),
    initialPageParam: 1,
    getNextPageParam: nextPageOf,
    enabled: Boolean(isSignedIn),
  });
  return { pages, zone, days: groupByDay(rowsOf(pages.data?.pages), zone) };
};
