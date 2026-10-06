import { ReactNode } from "react";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * The library's frame: the same header and footer as the public site, so
 * moving between a title page and the library never changes the chrome.
 * Already gated by the (app) layout; the user lookup is the cached one.
 */
const LibraryLayout = async ({ children }: Props) => {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter user={user} />
    </>
  );
};

export default LibraryLayout;
