"use client";

import Image, { ImageLoader } from "next/image";
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
 * A provider image, filling its positioned parent, fetched straight from the
 * provider's CDN at the size the slot needs (see catalogImageUrl). A client
 * component only because a loader is a function and cannot cross from the
 * server; it renders on the server like any other image.
 */
export const CatalogImage = ({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: CatalogImageProps) => (
  <Image
    src={src}
    alt={alt}
    fill
    sizes={sizes}
    loader={loader}
    priority={priority}
    className={`object-cover ${className}`}
  />
);
