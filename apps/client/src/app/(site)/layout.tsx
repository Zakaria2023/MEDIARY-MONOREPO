import { ReactNode } from "react";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  children: ReactNode;
};

/**
 * THE PUBLIC SITE'S FRAME: the landing page, explore, search and every
 * title page. Open to everyone; the header only changes what it offers once
 * it knows who is looking. No page in here redirects to sign-in.
 */
const SiteLayout = async ({ children }: Props) => {
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </>
  );
};

export default SiteLayout;
