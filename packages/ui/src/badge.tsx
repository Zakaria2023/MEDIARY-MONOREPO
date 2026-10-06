import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "violet";

type BadgeProps = {
  tone?: BadgeTone;
  /** A small glyph before the text. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-secondary",
  accent: "bg-accent-tint text-accent",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  violet: "bg-violet-tint text-violet",
};

/**
 * A small label: a year, a medium, a format, a platform. Tinted rather than
 * filled, so a row of them does not shout. A tracking status gets its own
 * component (StatusChip in the app) because its color comes from the status,
 * not from a tone the caller picks.
 */
export const Badge = ({
  tone = "neutral",
  icon,
  className = "",
  children,
}: BadgeProps) => (
  <span
    className={`inline-flex h-6 items-center gap-1 rounded-chip px-2 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
  >
    {icon}
    {children}
  </span>
);
