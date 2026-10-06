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
  className = "",
}: PosterProps) => (
  <div
    className={`relative aspect-poster w-full overflow-hidden rounded-card ring-1 ring-hairline ${className}`}
    style={dominantColor ? { backgroundColor: dominantColor } : undefined}
  >
    {src ? (
      <CatalogImage src={src} alt={alt} sizes={sizes} priority={priority} />
    ) : (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center rounded-card border border-dashed border-hairline-strong text-faint"
      >
        <ImageOff size={20} />
      </div>
    )}
  </div>
);
