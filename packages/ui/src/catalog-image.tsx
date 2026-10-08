"use client";

import { ImageOff } from "lucide-react";
import Image, { ImageLoader } from "next/image";
import { useState } from "react";
import { catalogImageUrl } from "utils";

type CatalogImageProps = {
  src: string;
  alt: string;
  /** How wide the slot is at each breakpoint; the loader sizes to it. */
  sizes: string;
  /** For the one image above the fold: the hero poster and backdrop. */
  priority?: boolean;
  className?: string;
};

const loader: ImageLoader = ({ src, width }) => catalogImageUrl(src, width);

/**
 * Catalog artwork, filling its box, sized by the provider's own CDN. A file
 * the provider no longer has (a record whose cover was never scanned
 * answers 404) shows the outlined placeholder in its place, never the
 * browser's broken image and its alt text.
 */
export const CatalogImage = ({ src, alt, sizes, priority = false, className = "" }: CatalogImageProps) => {
  // Appearance only, read nowhere else: whether this one file failed.
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center border border-dashed border-hairline-strong text-faint"
      >
        <ImageOff size={20} />
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loader={loader}
      priority={priority}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};
