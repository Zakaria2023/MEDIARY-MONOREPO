import Image from "next/image";

type UserAvatarProps = {
  name: string;
  imageUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const SIZE_PIXELS: Record<NonNullable<UserAvatarProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
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
 * A person's picture, or their initials until they have one. Round, always,
 * so it is told apart from a poster at a glance, and on the surface color
 * with no plate behind it.
 */
export const UserAvatar = ({ name, imageUrl, size = "md" }: UserAvatarProps) =>
  imageUrl ? (
    <Image
      src={imageUrl}
      alt={name}
      width={SIZE_PIXELS[size]}
      height={SIZE_PIXELS[size]}
      className={`shrink-0 rounded-full object-cover ring-2 ring-page ${SIZE_CLASSES[size]}`}
    />
  ) : (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-display font-medium text-ink ring-2 ring-page ${SIZE_CLASSES[size]}`}
    >
      {initialsOf(name)}
    </span>
  );
