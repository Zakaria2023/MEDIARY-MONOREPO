"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/components/layout/nav-items";

type NavLinkProps = {
  item: NavItem;
  /** Icon only, for the top bar on a phone. */
  compact?: boolean;
};

/**
 * One sidebar destination. Active when the path is the item or beneath it,
 * except the overview, which is active only at the root. The active state is
 * a flat tint and the accent on the icon: one of the two accents a screen
 * gets, and not a gradient.
 */
export const NavLink = ({ item, compact = false }: NavLinkProps) => {
  const pathname = usePathname();
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={compact ? item.label : undefined}
      className={`flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary-tint text-ink"
          : "text-muted hover:bg-hover hover:text-ink"
      } ${compact ? "h-9 w-9 justify-center px-0" : ""}`}
    >
      <Icon size={18} className={active ? "text-accent" : undefined} />
      {!compact && <span className="font-medium">{item.label}</span>}
    </Link>
  );
};
