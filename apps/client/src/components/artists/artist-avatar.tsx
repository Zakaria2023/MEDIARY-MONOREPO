import { Mic } from "lucide-react";
import { CatalogImage } from "ui";

type ArtistAvatarProps = {
  name: string;
  /** Their best known record's cover; the catalog has no portraits. */
  coverUrl: string | null;
  dominantColor: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * An artist's picture: a round crop of their best known record's cover,
 * on the cover's own color while it loads, and a microphone where there is
 * no cover at all.
 */
export const ArtistAvatar = ({ name, coverUrl, dominantColor, sizes, priority = false, className = "" }: ArtistAvatarProps) => (
  <div
    className={`relative aspect-square overflow-hidden rounded-full ring-1 ring-hairline ${className}`}
    style={dominantColor ? { backgroundColor: dominantColor } : undefined}
  >
    {coverUrl ? (
      <CatalogImage src={coverUrl} alt={name} sizes={sizes} priority={priority} />
    ) : (
      <span className="absolute inset-0 flex items-center justify-center border border-dashed border-hairline-strong text-faint">
        <Mic size={28} />
      </span>
    )}
  </div>
);
