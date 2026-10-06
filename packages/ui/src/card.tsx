import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `flat` drops the surface fill, keeping only the hairline. */
  variant?: "surface" | "flat";
  /** Tighter padding for a card that is one row of content. */
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
};

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

/**
 * A surface. The card is told apart from the page by its hairline, never by a
 * shadow: a card that needs a shadow to be seen is a card whose border is
 * missing.
 */
export const Card = ({
  variant = "surface",
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) => (
  <div
    className={`rounded-card border border-hairline ${
      variant === "surface" ? "bg-surface" : "bg-transparent"
    } ${PADDING_CLASSES[padding]} ${className}`}
    {...props}
  >
    {children}
  </div>
);
