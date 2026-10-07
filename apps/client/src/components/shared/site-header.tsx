import { UserMenu } from "auth";
import { BarChart3, Bell, BookMarked, ListChecks, NotebookPen, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AuthUser } from "services";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SearchPalette } from "@/components/search/search-palette";
import { Logo } from "@/components/shared/logo";
import { profilePath } from "@/lib/profile-path";

type SiteHeaderProps = {
  /** The viewer, resolved by the page or layout that renders the header. */
  user: AuthUser | null;
};

/**
 * The header: the mark, Explore, search everywhere, and either the sign-in
 * links or the account menu. The viewer is passed in because the header is
 * a server component and knows who is looking from the request. A member
 * also sees Library; adding happens on a title's own page.
 */
export const SiteHeader = ({ user }: SiteHeaderProps) => (
  <header className="sticky top-0 z-40 border-b border-hairline bg-page/80 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-5 sm:gap-4 sm:px-8">
      <Link href="/" aria-label="Mediary home" className="shrink-0">
        <span className="hidden sm:block">
          <Logo />
        </span>
        <span className="sm:hidden">
          <Logo wordmark={false} />
        </span>
      </Link>
      <nav aria-label="Primary" className="flex items-center">
        <Link
          href="/explore"
          className="flex h-9 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
        >
          Explore
        </Link>
        {user && (
          <Link
            href="/library"
            className="flex h-9 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            Library
          </Link>
        )}
        {user && (
          <Link
            href="/feed"
            className="hidden h-9 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink sm:flex"
          >
            Feed
          </Link>
        )}
      </nav>
      <div className="ms-auto flex items-center gap-2">
        <SearchPalette />
        {user && (
          <Suspense
            fallback={
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-hover hover:text-ink"
              >
                <Bell size={18} />
              </Link>
            }
          >
            <NotificationBell userUuid={user.uuid} />
          </Suspense>
        )}
        {user ? (
          <UserMenu
            name={user.displayName}
            detail={user.username ? `@${user.username}` : user.email}
            imageUrl={user.imageUrl}
            signOutRedirect="/"
            links={[
              ...(user.username
                ? [{ label: "Profile", href: profilePath(user.username), icon: <UserRound size={16} /> }]
                : []),
              { label: "Notifications", href: "/notifications", icon: <Bell size={16} /> },
              { label: "Library", href: "/library", icon: <BookMarked size={16} /> },
              { label: "Lists", href: "/lists", icon: <ListChecks size={16} /> },
              { label: "Diary", href: "/diary", icon: <NotebookPen size={16} /> },
              { label: "Stats", href: "/stats", icon: <BarChart3 size={16} /> },
              { label: "Settings", href: "/settings/profile", icon: <Settings size={16} /> },
            ]}
          />
        ) : (
          <>
            <Link
              href="/sign-in"
              className="hidden h-9 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink sm:flex"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="flex h-9 items-center rounded-control bg-action-gradient px-3.5 text-sm font-medium text-white"
            >
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Create your Mediary</span>
            </Link>
          </>
        )}
      </div>
    </div>
  </header>
);
