type SkeletonProps = {
  className?: string;
  /** A poster-shaped box (2:3). The default is a bar. */
  shape?: "bar" | "poster" | "circle" | "block";
};

const SHAPE_CLASSES: Record<NonNullable<SkeletonProps["shape"]>, string> = {
  bar: "h-4 rounded",
  poster: "aspect-poster w-full rounded-card",
  circle: "rounded-full",
  block: "rounded-card",
};

/**
 * A loading box with a moving highlight. It must match the SHAPE of what it
 * replaces: a poster grid skeleton is a grid of 2:3 boxes, a row of text is
 * a bar. A skeleton the wrong shape is a layout shift when the content lands.
 */
export const Skeleton = ({ className = "", shape = "bar" }: SkeletonProps) => (
  <div
    aria-hidden="true"
    className={`skeleton ${SHAPE_CLASSES[shape]} ${className}`}
  />
);
