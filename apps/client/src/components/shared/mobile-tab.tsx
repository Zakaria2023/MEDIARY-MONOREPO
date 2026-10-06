import Link from "next/link";
import type { ReactNode } from "react";

type MobileTabProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
};

/** One of the five targets on the phone's bottom bar. */
export const MobileTab = ({ href, label, icon, active }: MobileTabProps) => (
  <Link
    href={href}
    aria-current={active ? "page" : undefined}
    className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
      active ? "text-ink" : "text-faint"
    }`}
  >
    {icon}
    {label}
  </Link>
);
