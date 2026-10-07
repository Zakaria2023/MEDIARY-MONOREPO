import { Skeleton } from "ui";
import { DIARY_GRID_CLASSES } from "@/components/diary/diary-lines";

type DiaryLinesSkeletonProps = {
  rows: number;
};

/** Diary cards' shape while they load: a small poster, a title, a detail line and a time. */
export const DiaryLinesSkeleton = ({ rows }: DiaryLinesSkeletonProps) => (
  <div className={DIARY_GRID_CLASSES} aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex gap-3 rounded-card border border-hairline bg-surface p-3">
        <Skeleton shape="poster" className="w-14" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="w-3/4" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-auto h-3 w-10" />
        </div>
      </div>
    ))}
  </div>
);
