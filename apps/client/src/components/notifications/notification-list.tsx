import { listNotifications } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { MarkReadOnOpen } from "@/components/notifications/mark-read-on-open";
import { NotificationLine } from "@/components/notifications/notification-line";

type NotificationListProps = {
  userUuid: string;
  page: number;
};

/** One page of notifications, or the sentence that explains an empty one. Opening it marks everything read. */
export const NotificationList = async ({ userUuid, page }: NotificationListProps) => {
  const result = await listNotifications(userUuid, { page });
  const unread = result.items.some((item) => item.readAt === null);

  if (result.total === 0) {
    return (
      <CatalogEmptyState
        heading="Nothing yet"
        body="When someone follows you, likes your review or replies to you, it shows up here."
        action={{ label: "Open your feed", href: "/feed" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {unread && <MarkReadOnOpen />}
      <ol className="flex flex-col divide-y divide-hairline-soft overflow-hidden rounded-card border border-hairline bg-surface">
        {result.items.map((item) => (
          <NotificationLine key={item.uuid} item={item} />
        ))}
      </ol>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/notifications", { page: target })}
      />
    </div>
  );
};
