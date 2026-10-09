"use client";

import { LoaderCircle, Telescope } from "lucide-react";
import { Button } from "ui";
import { LaunchMediaType } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { useLookFurther } from "@/app/(site)/search/use-look-further";
import { FoundArtistRow } from "@/components/search/found-artist-row";
import { FoundRowsSkeleton } from "@/components/search/found-rows-skeleton";
import { FoundTitleRow } from "@/components/search/found-title-row";

type LookFurtherProps = {
  query: string;
  mediaType: LaunchMediaType | undefined;
};

/**
 * THE LONG TAIL, for members: under the search results, one press asks the
 * sources Mediary's catalog comes from for the same words. Artists first
 * when there are any, then each medium's hits; whatever is not held yet can
 * be brought in, for everyone, and opens on its new page.
 */
export const LookFurther = ({ query, mediaType }: LookFurtherProps) => {
  const {
    onLook,
    isLooking,
    looked,
    lookError,
    groups,
    artists,
    unanswered,
    onBringTitle,
    onBringArtist,
    workingKey,
    isBringing,
    bringError,
  } = useLookFurther({ query, mediaType });

  return (
    <section
      aria-labelledby="look-further-heading"
      className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-xl flex-col gap-1">
          <h2 id="look-further-heading" className="font-display text-lg font-semibold text-ink">
            Not finding it?
          </h2>
          <p className="text-sm text-muted">
            Mediary can look further, in the catalogs its titles come from, and bring what you find in for everyone.
          </p>
        </div>
        {!looked && (
          <Button onClick={onLook} disabled={isLooking}>
            {isLooking ? <LoaderCircle size={16} className="animate-spin" /> : <Telescope size={16} />}
            {isLooking ? "Looking" : "Look further"}
          </Button>
        )}
      </div>

      {lookError && (
        <p role="alert" className="text-sm text-danger">
          {lookError}
        </p>
      )}
      {bringError && (
        <p role="alert" className="text-sm text-danger">
          {bringError}
        </p>
      )}

      {isLooking && <FoundRowsSkeleton />}

      {looked && !isLooking && (
        <div aria-live="polite" className="flex flex-col gap-6">
          {artists.length > 0 && (
            <div className="flex flex-col">
              <h3 className="text-xs font-medium uppercase tracking-wide text-faint">Artists</h3>
              <ul className="divide-y divide-hairline">
                {artists.map((artist) => (
                  <FoundArtistRow
                    key={artist.mbid}
                    artist={artist}
                    working={workingKey === `artist:${artist.mbid}`}
                    disabled={isBringing}
                    onBring={() => onBringArtist(artist)}
                  />
                ))}
              </ul>
            </div>
          )}
          {groups.map((group) => (
            <div key={group.mediaType} className="flex flex-col">
              <h3 className="text-xs font-medium uppercase tracking-wide text-faint">
                {MEDIA_TYPE_PLURAL_LABELS[group.mediaType]}
              </h3>
              <ul className="divide-y divide-hairline">
                {group.titles.map((title) => (
                  <FoundTitleRow
                    key={`${title.provider}:${title.externalId}`}
                    title={title}
                    mediaType={group.mediaType}
                    working={workingKey === `${title.provider}:${title.externalId}`}
                    disabled={isBringing}
                    onBring={() => onBringTitle(title, group.mediaType)}
                  />
                ))}
              </ul>
            </div>
          ))}
          {groups.length === 0 && artists.length === 0 && (
            <p className="text-sm text-muted">
              The catalogs have nothing called &ldquo;{query}&rdquo; either. Try the original title, or another spelling.
            </p>
          )}
          {unanswered.length > 0 && (
            <p className="text-xs text-faint">
              {unanswered.map((type) => MEDIA_TYPE_PLURAL_LABELS[type]).join(", ")} could not be searched just now.
            </p>
          )}
        </div>
      )}
    </section>
  );
};
