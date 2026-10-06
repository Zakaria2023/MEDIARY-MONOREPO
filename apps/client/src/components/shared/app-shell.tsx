import { BookMarked, Compass, Home, Plus, Search, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/shared/avatar";
import { Logo } from "@/components/shared/logo";
import { MobileTab } from "@/components/shared/mobile-tab";
import { ME } from "@/lib/design/mock";

type Destination =
  | "home"
  | "explore"
  | "library"
  | "feed"
  | "lists"
  | "profile"
  | "none";

type AppShellProps = {
  /** Which top-level destination is current, for the active state. */
  current: Destination;
  children: ReactNode;
};

type NavItem = {
  key: Destination;
  label: string;
  href: string;
};

const DESKTOP_NAV: NavItem[] = [
  { key: "explore", label: "Explore", href: "/design/explore" },
  { key: "library", label: "My Library", href: "/design/library" },
  { key: "feed", label: "Feed", href: "/design/home" },
  { key: "lists", label: "Lists", href: "/design/library" },
];

/**
 * THE CHROME EVERY SIGNED-IN SCREEN SITS IN. A top bar on a desktop with the
 * wordmark, the four destinations, search and the Add button; a bottom bar on
 * a phone with five thumb-sized targets, the Add in the middle because it is
 * the one action the product is about.
 *
 * The bar is translucent over the page with a blur, so a poster scrolling
 * under it shows through: the chrome is a layer, not a wall.
 */
export const AppShell = ({ current, children }: AppShellProps) => (
  <div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-40 border-b border-hairline bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-5 sm:px-8">
        <Link href="/design/home" aria-label="Mediary home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {DESKTOP_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={current === item.key ? "page" : undefined}
              className={`flex h-9 items-center rounded-control px-3 text-sm font-medium transition-colors ${
                current === item.key
                  ? "bg-surface-2 text-ink"
                  : "text-muted hover:bg-hover hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search, as a button that opens the command palette. On a phone the
            Explore tab carries it. */}
        <button
          type="button"
          className="ms-auto hidden h-9 w-72 cursor-pointer items-center gap-2 rounded-control border border-hairline bg-surface px-3 text-sm text-faint transition-colors hover:border-hairline-strong hover:text-muted md:flex"
        >
          <Search size={16} />
          <span className="flex-1 text-start">Search everything</span>
          <kbd className="rounded border border-hairline px-1.5 font-mono text-[10px] text-faint">
            /
          </kbd>
        </button>

        <Link
          href="/design/add"
          className="hidden h-9 items-center gap-1.5 rounded-control bg-action-gradient px-3.5 text-sm font-medium text-white md:flex"
        >
          <Plus size={16} />
          Add
        </Link>

        <Link
          href="/design/profile"
          aria-label="Your profile"
          className="ms-auto md:ms-0"
        >
          <Avatar user={ME} size="sm" />
        </Link>
      </div>
    </header>

    <main className="flex-1 pb-20 md:pb-0">{children}</main>

    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-page/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        <MobileTab
          href="/design/home"
          label="Home"
          icon={<Home size={22} />}
          active={current === "home"}
        />
        <MobileTab
          href="/design/explore"
          label="Explore"
          icon={<Compass size={22} />}
          active={current === "explore"}
        />
        <Link
          href="/design/add"
          aria-label="Add to Mediary"
          className="flex items-center justify-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-chip bg-action-gradient text-white">
            <Plus size={24} />
          </span>
        </Link>
        <MobileTab
          href="/design/library"
          label="Library"
          icon={<BookMarked size={22} />}
          active={current === "library"}
        />
        <MobileTab
          href="/design/profile"
          label="Profile"
          icon={<User size={22} />}
          active={current === "profile"}
        />
      </div>
    </nav>
  </div>
);
