"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useUserMenu } from "./use-user-menu";

export type UserMenuLink = {
  label: string;
  href: string;
  icon: ReactNode;
};

type UserMenuProps = {
  name: string;
  /** The line under the name: an email or a handle. */
  detail: string | null;
  imageUrl: string | null;
  links: UserMenuLink[];
  signOutRedirect: string;
  /** Which edge the panel opens toward. */
  align?: "start" | "end";
  /** "up" for a menu at the foot of a sidebar. */
  direction?: "down" | "up";
};

/** First letters of a name, for the avatar when there is no picture. */
const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

/**
 * THE ACCOUNT MENU: the person's avatar as a button, opening a panel with
 * their name, the app's own links and Sign out. Mediary's, end to end; it
 * replaces the identity service's own button, which carried its branding.
 */
export const UserMenu = ({
  name,
  detail,
  imageUrl,
  links,
  signOutRedirect,
  align = "end",
  direction = "down",
}: UserMenuProps) => {
  const { open, rootRef, toggle, close, isSigningOut, onSignOut } = useUserMenu(signOutRedirect);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Your account"
        className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline-strong transition-shadow hover:ring-accent"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-surface-2 text-xs font-medium text-ink">
            {initialsOf(name)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-64 animate-menu-in rounded-card border border-hairline bg-overlay p-1.5 shadow-xl ${
            align === "end" ? "end-0" : "start-0"
          } ${direction === "down" ? "top-full mt-2" : "bottom-full mb-2"}`}
        >
          <div className="flex flex-col px-3 py-2.5">
            <span className="line-clamp-1 text-sm font-medium text-ink">{name}</span>
            {detail && <span className="line-clamp-1 text-xs text-muted">{detail}</span>}
          </div>
          <div className="my-1 h-px bg-hairline" />
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={close}
              className="flex items-center gap-2.5 rounded-control px-3 py-2 text-sm text-secondary transition-colors hover:bg-hover hover:text-ink"
            >
              <span className="text-muted">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-start text-sm text-secondary transition-colors hover:bg-hover hover:text-ink disabled:opacity-60"
          >
            <LogOut size={16} className="text-muted" />
            {isSigningOut ? "Signing out" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
};
