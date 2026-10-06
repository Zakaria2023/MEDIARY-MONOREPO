import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { AuthUser } from "services";
import { USER_ROLE_LABELS } from "@/db/label";
import { Logo } from "@/components/layout/logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { NavLink } from "@/components/layout/nav-link";

type SidebarProps = {
  user: AuthUser;
};

/**
 * The desktop navigation: the mark, the destinations, and at the foot the
 * signed-in staff member with their role, beside Clerk's account menu. A
 * hairline separates it from the screen; nothing else does.
 */
export const Sidebar = ({ user }: SidebarProps) => (
  <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-hairline bg-page md:flex">
    <div className="flex h-16 items-center px-5">
      <Link href="/" aria-label="Overview">
        <Logo />
      </Link>
    </div>
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3 py-2">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
    <div className="flex items-center gap-3 border-t border-hairline px-4 py-4">
      <UserButton />
      <div className="flex min-w-0 flex-col">
        <span className="line-clamp-1 text-sm font-medium text-ink">
          {user.displayName}
        </span>
        <span className="text-xs text-muted">{USER_ROLE_LABELS[user.role]}</span>
      </div>
    </div>
  </aside>
);
