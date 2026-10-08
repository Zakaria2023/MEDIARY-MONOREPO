import { listMoreFromArtist } from "services";
import { TitleRail } from "@/components/catalog/title-rail";
import { artistPath } from "@/lib/artist-path";

type MoreFromArtistProps = {
  artistUuid: string;
  artistName: string;
  artistSlug: string;
  /** The record on the page, left out of the row. */
  mediaUuid: string;
};

/** The artist's other records under one of them, best known first; nothing when there are none. */
export const MoreFromArtist = async ({ artistUuid, artistName, artistSlug, mediaUuid }: MoreFromArtistProps) => {
  const records = await listMoreFromArtist(artistUuid, mediaUuid);
  if (records.length === 0) {
    return null;
  }
  return (
    <TitleRail
      heading={`More from ${artistName}`}
      reason="Their other albums and EPs in Mediary."
      href={artistPath(artistSlug)}
      titles={records}
    />
  );
};
