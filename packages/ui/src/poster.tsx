import { ImageOff } from "lucide-react";
import { CatalogImage } from "./catalog-image";

type PosterProps = {
  src: string | null;
  /** The title's name; the image's alt text. */
  alt: string;
  sizes: string;
  /** Painted while the image loads, when the catalog knows one. */
  dominantColor?: string | null;
  priority?: boolean;
  /** The corner: a card's on a grid or a hero, a control's on a small poster beside a line of text, where the card radius would round it into a blob. */
  radius?: "card" | "control";
  className?: string;
};

/**
 * A title's 2:3 poster. The artwork sits on the surface itself, with no
 * plate behind it; while it loads the box shows the title's dominant color
 * where the catalog has one, inside a hairline. A title with no poster keeps
 * its slot and shows the outlined placeholder, so a row never loses its
 * image column.
 */
export const Poster = ({
  src,
  alt,
  sizes,
  dominantColor,
  priority = false,
  radius = "card",
  className = "",
}: PosterProps) => (
  <div
    className={`relative aspect-poster w-full overflow-hidden ${radius === "card" ? "rounded-card" : "rounded-control"} ring-1 ring-hairline ${className}`}
    style={dominantColor ? { backgroundColor: dominantColor } : undefined}
  >
    {src ? (
      <CatalogImage src={src} alt={alt} sizes={sizes} priority={priority} />
    ) : (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center border border-dashed border-hairline-strong text-faint ${radius === "card" ? "rounded-card" : "rounded-control"}`}
      >
        <ImageOff size={20} />
      </div>
    )}
  </div>
);
