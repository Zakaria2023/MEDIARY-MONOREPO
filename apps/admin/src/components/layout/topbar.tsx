import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AuthUser } from "services";
import { Logo } from "@/components/layout/logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { NavLink } from "@/components/layout/nav-link";

type TopbarProps = {
  user: AuthUser;
};

/**
 * The phone navigation: the same destinations as the sidebar, as icons in a
 * bar across the top, with the account menu on the end edge. Hidden from
 * the medium breakpoint up, where the sidebar takes over.
 */
export const Topbar = ({ user }: TopbarProps) => (
  <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-hairline bg-page/80 px-4 backdrop-blur-md md:hidden">
    <Link href="/" aria-label="Overview">
      <Logo wordmark={false} />
    </Link>
    <nav aria-label="Admin" className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} compact />
      ))}
    </nav>
    <div className="ms-auto flex items-center gap-2">
      <span className="line-clamp-1 text-sm text-muted">{user.displayName}</span>
      <UserButton />
    </div>
  </header>
);
