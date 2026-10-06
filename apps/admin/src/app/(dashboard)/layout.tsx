import { ReactNode } from "react";
import { Shell } from "@/components/layout/shell";
import { requireStaff } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * THE ROLE GATE FOR EVERY DASHBOARD SCREEN. It lives here rather than in
 * each page.tsx because a page decides what a screen looks like, not who
 * may see it, and rather than in proxy.ts because the role is a column on
 * Mediary's Users row, which needs a database read the middleware should
 * not pay on every asset request. Actions call requireStaff themselves.
 */
const DashboardLayout = async ({ children }: Props) => {
  const user = await requireStaff();

  return <Shell user={user}>{children}</Shell>;
};

export default DashboardLayout;
