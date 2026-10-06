import { ReactNode } from "react";
import { AuthUser } from "services";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

type ShellProps = {
  user: AuthUser;
  children: ReactNode;
};

/**
 * The dashboard frame: a fixed sidebar on the start edge from the medium
 * breakpoint up, a top bar with the same destinations below it, and the
 * screen in the remaining width. The sidebar is a server component; it
 * takes the viewer rather than reading it because Clerk's signed-in helpers
 * are client-only.
 */
export const Shell = ({ user, children }: ShellProps) => (
  <div className="flex min-h-screen flex-col md:flex-row">
    <Sidebar user={user} />
    <Topbar user={user} />
    <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  </div>
);
