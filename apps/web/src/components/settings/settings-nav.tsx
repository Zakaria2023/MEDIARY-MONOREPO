"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = {
  href: string;
  label: string;
};

const SECTIONS: Section[] = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/account", label: "Account" },
];

/**
 * The settings sections. A column on a desktop, a scrolling row on a phone.
 * The current one is read from the path so the nav never has to be told.
 */
export const SettingsNav = () => {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto md:flex-col">
        {SECTIONS.map((section) => {
          const active = pathname.startsWith(section.href);
          return (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-9 items-center rounded-control px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-2 text-ink"
                    : "text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
