import { RequireMember } from "@/components/layout/require-member";
import { NotificationsScreen } from "@/components/social/notifications-screen";

/** Follows, likes and replies on the member's things. Opening it marks them read. */
const NotificationsRoute = () => (
  <RequireMember>
    <NotificationsScreen />
  </RequireMember>
);

export default NotificationsRoute;
