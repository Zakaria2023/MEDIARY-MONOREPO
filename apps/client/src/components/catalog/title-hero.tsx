import { Plus, Star } from "lucide-react";
import Link from "next/link";
import { AuthUser, CatalogTitle, ListChoice, TitleTracking } from "services";
import { Badge, CatalogImage, Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { titleStatusLabel } from "@/lib/title-status";
import { AddToListButton } from "@/components/lists/add-to-list-button";
import { TrackButton } from "@/components/tracking/track-button";

type TitleHeroProps = {
  title: CatalogTitle;
  viewer: AuthUser | null;
  /** The title as the sheet needs it, with the viewer's entry; null for a visitor. */
  tracking: TitleTracking | null;
  /** The viewer's lists and whether this title is on each; empty for a visitor. */
  listChoices: ListChoice[];
};

/**
 * The first screen of a title page, rendered on the server: the backdrop
 * behind a scrim, the poster, the name as the page's h1, its badges, the
 * community score and the primary action, all in the HTML before any script
 * runs. A visitor without an account is offered one; a member gets the
 * track button, which is the Add sheet's door.
 */
export const TitleHero = ({ title, viewer, tracking, listChoices }: TitleHeroProps) => {
  const original = title.titles.find(
    (entry) => entry.titleType === "native" && entry.title !== title.canonicalTitle,
  );

  return (
    <section className="relative isolate overflow-hidden">
      {title.backdropUrl && (
        <div className="absolute inset-0 -z-10">
          <CatalogImage
            src={title.backdropUrl}
            alt=""
            sizes="100vw"
            priority
            className="opacity-40"
          />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-backdrop-fade" />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-8 pt-8 sm:flex-row sm:items-end sm:gap-8 sm:px-8 sm:pt-24">
        <div className={`shrink-0 ${title.mediaType === "music" ? "w-48 sm:w-64" : "w-36 sm:w-56"}`}>
          <Poster
            src={title.coverUrl}
            alt={`${title.canonicalTitle} ${title.mediaType === "music" ? "cover" : "poster"}`}
            sizes={title.mediaType === "music" ? "(min-width: 640px) 256px, 192px" : "(min-width: 640px) 224px, 144px"}
            dominantColor={title.dominantColor}
            priority
            shape={title.mediaType === "music" ? "square" : "poster"}
            className="ring-hairline-strong"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{MEDIA_TYPE_LABELS[title.mediaType]}</Badge>
            {title.releaseYear && <Badge>{title.releaseYear}</Badge>}
            {title.status !== "released" && title.status !== "unknown" && (
              <Badge tone={title.status === "releasing" ? "accent" : "neutral"}>
                {titleStatusLabel(title.mediaType, title.status)}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              {title.canonicalTitle}
            </h1>
            {original && <p className="text-base text-muted">{original.title}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            {title.providerScore !== null && (
              <span className="tabular inline-flex items-center gap-1.5 text-ink">
                <Star size={15} className="fill-current text-warning" />
                <span className="font-medium">{title.providerScore.toFixed(1)}</span>
                <span className="text-muted">community score</span>
              </span>
            )}
            {title.genres.length > 0 && (
              <span>{title.genres.map((genre) => genre.name).join(" · ")}</span>
            )}
          </div>

          {viewer && tracking && (
            <div className="flex flex-wrap items-end gap-2">
              <TrackButton target={tracking.target} initialEntry={tracking.entry} />
              <AddToListButton mediaUuid={title.uuid} initial={listChoices} />
            </div>
          )}

          {!viewer && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center gap-2 rounded-control bg-action-gradient px-5 text-base font-medium text-white"
              >
                <Plus size={18} />
                Track it on Mediary
              </Link>
              <span className="text-sm text-muted">Free, and it takes a minute.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
