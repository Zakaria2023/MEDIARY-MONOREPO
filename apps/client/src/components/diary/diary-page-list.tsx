import { getUserTimezone, listDiary } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { DiaryDays } from "@/components/diary/diary-days";

type DiaryPageListProps = {
  userUuid: string;
  page: number;
};

/** One page of the diary, grouped by day, with the pages as links. */
export const DiaryPageList = async ({ userUuid, page }: DiaryPageListProps) => {
  const [result, timezone] = await Promise.all([
    listDiary(userUuid, { page }),
    getUserTimezone(userUuid),
  ]);

  if (result.total === 0) {
    return (
      <CatalogEmptyState
        heading="Nothing logged yet"
        body="Every episode, session and film you log lands here, in order, for as long as you keep the account."
        action={{ label: "Open your library", href: "/library" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <DiaryDays lines={result.items} timezone={timezone} />
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/diary", { page: target })}
      />
    </div>
  );
};
