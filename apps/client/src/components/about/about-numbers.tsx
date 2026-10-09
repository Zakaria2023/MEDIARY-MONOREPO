import Link from "next/link";
import { formatCount } from "utils";
import { launchMediaTypes } from "@/db/enum";
import { HUB_COPY } from "@/lib/hub-copy";
import { hubPath } from "@/lib/hub-path";
import { MEDIA_TEXT_CLASSES } from "@/lib/media-colors";
import { countCatalogByType } from "@/lib/server/catalog-cache";

/**
 * THE CATALOG IN NUMBERS, read live: the whole, then each medium in its own
 * color, every figure a link to that medium's hub. A medium with nothing
 * in it yet says it is on its way rather than showing a zero.
 */
export const AboutNumbers = async () => {
  const counts = await countCatalogByType();
  const total = launchMediaTypes.reduce((sum, mediaType) => sum + (counts[mediaType] ?? 0), 0);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-24 sm:px-8 sm:py-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">The catalog</p>
          <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            <span className="tabular">{formatCount(total)}</span> titles, and counting.
          </h2>
        </div>
        <p className="max-w-md text-base leading-relaxed text-muted">
          Drawn from public catalogs of film, television, games, anime, manga, comics, music and books, credited on the{" "}
          <Link href="/credits" className="text-accent transition-colors hover:text-accent-hover">
            credits page
          </Link>
          . Kept fresh from each source.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-4 lg:grid-cols-8">
        {launchMediaTypes.map((mediaType) => {
          const count = counts[mediaType] ?? 0;
          return (
            <li key={mediaType} className="bg-page">
              <Link href={hubPath(mediaType)} className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-hover sm:p-6">
                <span className={`tabular font-display text-2xl font-semibold sm:text-3xl ${count > 0 ? MEDIA_TEXT_CLASSES[mediaType] : "text-faint"}`}>
                  {count > 0 ? formatCount(count) : "Soon"}
                </span>
                <span className="text-sm text-muted">{HUB_COPY[mediaType].heading}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
