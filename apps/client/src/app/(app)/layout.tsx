import { ReactNode } from "react";
import { requireOnboardedUser } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * THE GATE FOR EVERY PRIVATE SCREEN: settings, and later the library, the
 * diary, the stats and the feed. It lives here rather than in each page.tsx
 * for the reason CLAUDE.md gives: a page decides what a screen looks like,
 * not who may see it. Actions check the caller themselves, so data paths
 * are gated independently of this.
 */
const AppLayout = async ({ children }: Props) => {
  await requireOnboardedUser();

  return <>{children}</>;
};

export default AppLayout;
