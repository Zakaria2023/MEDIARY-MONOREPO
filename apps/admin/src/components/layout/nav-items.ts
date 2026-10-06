import { DownloadCloud, LayoutDashboard, Library, LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * The sidebar's destinations. One per screen that exists; a step adds its
 * entry when it adds the screen, never before, so nothing here leads to a
 * page that is not built. Members and reports follow.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/catalog", label: "Catalog", icon: Library },
  { href: "/imports", label: "Imports", icon: DownloadCloud },
];
