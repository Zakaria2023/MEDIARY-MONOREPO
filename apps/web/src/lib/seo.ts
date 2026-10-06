import type { Metadata } from "next";

type PageMetadataInput = {
  /** Page-specific part only; the root layout's template appends the site name. */
  title: string;
  description: string;
  /** Route path, leading slash, no origin. The canonical is built from it. */
  path: string;
  /** Absolute or root-relative image URL. Falls back to the site-wide OG image. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  /**
   * Signed-in-only screens. Their content is real for the person looking at
   * it and worthless in an index: a crawler sees a sign-in redirect or a thin
   * near-duplicate of every other account page.
   */
  noIndex?: boolean;
  keywords?: string[];
};

export const SITE_NAME = "Mediary";

export const SITE_TAGLINE = "Your entertainment, beautifully tracked";

export const SITE_DESCRIPTION =
  "One profile for everything you watch, play, read, rate and love. Track anime, games, movies and TV in one place, compare taste with friends, and share your year.";

/**
 * The public origin, used for canonicals, OG URLs and the sitemap. Set
 * NEXT_PUBLIC_SITE_URL per environment; the fallback is the address the site
 * is supposed to be served at, so a missing variable produces a correct
 * canonical rather than a leaked preview hostname. Must stay in step with
 * INDEXABLE_HOSTS in packages/security-headers.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mediary.com"
).replace(/\/$/, "");

/** An absolute URL on the public origin from a root-relative path. */
export const absoluteUrl = (path: string): string =>
  path.startsWith("http") ? path : `${SITE_URL}${path}`;

/**
 * Everything a public page needs in its <head>, from four facts. Every
 * route's `generateMetadata` goes through here so a page cannot ship with a
 * canonical that disagrees with its OG URL, or with no description at all.
 */
export const pageMetadata = ({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noIndex = false,
  keywords,
}: PageMetadataInput): Metadata => {
  const url = absoluteUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl("/opengraph-image");

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: imageAlt ?? title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
};
