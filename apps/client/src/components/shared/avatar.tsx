import { MockUser } from "@/lib/design/mock";

type AvatarProps = {
  user: MockUser;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

/**
 * A user's picture, or their initials on their color until they upload one.
 * Round, always, so it is told apart from a poster at a glance.
 */
export const Avatar = ({ user, size = "md" }: AvatarProps) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-medium text-white ring-2 ring-page ${SIZE_CLASSES[size]}`}
    style={{ backgroundColor: user.color }}
    aria-label={user.displayName}
  >
    {user.initials}
  </span>
);
