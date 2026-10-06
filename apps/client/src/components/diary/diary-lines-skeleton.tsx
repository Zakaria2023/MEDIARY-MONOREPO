import { Skeleton } from "ui";

type DiaryLinesSkeletonProps = {
  rows: number;
};

/** Diary lines' shape while they load: a time, a badge, a small poster and two bars. */
export const DiaryLinesSkeleton = ({ rows }: DiaryLinesSkeletonProps) => (
  <div className="flex flex-col rounded-card border border-hairline bg-surface px-4">
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="grid grid-cols-[56px_auto_1fr] items-center gap-3 border-b border-hairline-soft py-3 last:border-b-0"
      >
        <Skeleton className="h-3 w-10" />
        <Skeleton shape="block" className="h-7 w-7" />
        <div className="flex items-center gap-3">
          <Skeleton shape="poster" className="w-7" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
