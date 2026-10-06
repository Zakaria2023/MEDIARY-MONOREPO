import { ReactNode } from "react";
import { MobileTabBar } from "@/components/shared/mobile-tab-bar";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { requireOnboardedUser } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * THE GATE FOR EVERY PRIVATE SCREEN: the library, the diary, the stats and
 * settings. It lives here rather than in each page.tsx for the reason
 * CLAUDE.md gives: a page decides what a screen looks like, not who may see
 * it. Actions check the caller themselves, so data paths are gated
 * independently of this. The frame is the public site's, so moving between
 * a title page and the library never changes the chrome.
 */
const AppLayout = async ({ children }: Props) => {
  const user = await requireOnboardedUser();

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col pb-14 sm:pb-0">{children}</div>
      <SiteFooter user={user} />
      {user.username && <MobileTabBar username={user.username} />}
    </>
  );
};

export default AppLayout;
