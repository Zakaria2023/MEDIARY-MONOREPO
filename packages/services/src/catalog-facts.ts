import { formatDate, formatRuntime } from "utils";
import { ANIME_FORMAT_LABELS, MEDIA_STATUS_LABELS, RELEASE_TYPE_LABELS, SEASON_LABELS } from "../../../db/label";
import { CatalogTitle } from "./catalog";

/** One labelled fact on a title page. */
export type CatalogFact = {
  label: string;
  value: string | null;
};

const count = (value: number | null): string | null =>
  value === null ? null : value.toLocaleString("en-US");

const yesNo = (value: boolean | null): string | null =>
  value === null ? null : value ? "Yes" : "No";

/**
 * The facts a title page lists under Details, in reading order: when it
 * came out and where it stands, then what only its medium has. Facts the
 * catalog does not know are left out rather than shown as blanks. The
 * public page and the admin page both read this, so they never disagree.
 */
export const catalogFacts = (title: CatalogTitle): CatalogFact[] => {
  const facts: CatalogFact[] = [
    { label: "Released", value: title.releaseDate ? formatDate(title.releaseDate) : null },
    { label: "Status", value: MEDIA_STATUS_LABELS[title.status] },
  ];
  const { details } = title;

  if (details?.kind === "movie") {
    facts.push(
      { label: "Runtime", value: formatRuntime(details.runtime) },
      { label: "Director", value: details.director },
      { label: "Rated", value: details.certification },
      { label: "Collection", value: details.collection },
    );
  } else if (details?.kind === "tv") {
    facts.push(
      { label: "Seasons", value: count(details.seasonCount) },
      { label: "Episodes", value: count(details.episodeCount) },
      { label: "Episode length", value: formatRuntime(details.episodeDuration) },
      { label: "Network", value: details.network },
      { label: "Ended", value: title.endDate ? formatDate(title.endDate) : null },
    );
  } else if (details?.kind === "game") {
    facts.push(
      { label: "Developer", value: details.developer },
      { label: "Publisher", value: details.publisher },
      { label: "Franchise", value: details.franchise },
      { label: "Multiplayer", value: yesNo(details.multiplayer) },
    );
  } else if (details?.kind === "anime") {
    facts.push(
      { label: "Format", value: details.format ? ANIME_FORMAT_LABELS[details.format] : null },
      { label: "Episodes", value: count(details.episodeCount) },
      { label: "Episode length", value: formatRuntime(details.episodeDuration) },
      {
        label: "Season",
        value:
          details.season && details.seasonYear
            ? `${SEASON_LABELS[details.season]} ${details.seasonYear}`
            : null,
      },
      { label: "Studio", value: details.studio },
      { label: "Source", value: details.sourceMaterial },
    );
  } else if (details?.kind === "music") {
    facts.push(
      { label: "Artist", value: details.artist },
      { label: "Type", value: RELEASE_TYPE_LABELS[details.releaseType] },
      { label: "Tracks", value: count(details.trackCount) },
      { label: "Length", value: formatRuntime(details.durationMinutes) },
      { label: "Label", value: details.label },
    );
  }

  return facts.filter((fact) => fact.value !== null && fact.value !== "");
};
