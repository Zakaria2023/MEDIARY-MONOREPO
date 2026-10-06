"use client";

import { BookMarked, Compass, Home, Rss, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { profilePath } from "@/lib/profile-path";

type MobileTabBarProps = {
  username: string;
};

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Whether a path counts as this tab. */
  matches: (pathname: string) => boolean;
};

/**
 * THE PHONE'S BOTTOM BAR for a member: five thumb-sized targets, so the
 * product's destinations are one tap away without the header's menu.
 * Hidden from the sm breakpoint up, where the header carries the links.
 */
export const MobileTabBar = ({ username }: MobileTabBarProps) => {
  const pathname = usePathname();
  const profile = profilePath(username);
  const tabs: Tab[] = [
    { href: "/", label: "Home", icon: <Home size={20} />, matches: (path) => path === "/" },
    { href: "/explore", label: "Explore", icon: <Compass size={20} />, matches: (path) => path.startsWith("/explore") || path.startsWith("/search") },
    { href: "/library", label: "Library", icon: <BookMarked size={20} />, matches: (path) => path.startsWith("/library") },
    { href: "/feed", label: "Feed", icon: <Rss size={20} />, matches: (path) => path.startsWith("/feed") },
    { href: profile, label: "Profile", icon: <UserRound size={20} />, matches: (path) => path === profile || path === `/profile/${username}` },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-hairline bg-page/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.matches(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
              active ? "text-ink" : "text-faint hover:text-ink"
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
