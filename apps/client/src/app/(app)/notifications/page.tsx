import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { NotificationList } from "@/components/notifications/notification-list";
import { NotificationSkeleton } from "@/components/notifications/notification-skeleton";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: "Notifications",
  description: "Who followed you, liked your reviews and replied to you.",
  path: "/notifications",
  noIndex: true,
});

/** NOTIFICATIONS: what people did to the viewer's things, newest first. Opening it marks everything read. */
const NotificationsPage = async ({ searchParams }: Props) => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  const page = Number(firstParam((await searchParams).page)) || 1;
  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading size="page" title="Notifications" description="Follows, likes and replies on your things." />
      <AsyncSection reloadKey={`notifications-${page}`} skeleton={<NotificationSkeleton />}>
        <NotificationList userUuid={user.uuid} page={page} />
      </AsyncSection>
    </main>
  );
};

export default NotificationsPage;
