import { listRelatedTitles } from "services";
import { MediaType } from "@/db/enum";
import { TitleRail } from "@/components/catalog/title-rail";

type RelatedTitlesProps = {
  mediaUuid: string;
  mediaType: MediaType;
};

/** "More like this": the same medium, sharing the most genres. Streams in last. */
export const RelatedTitles = async ({ mediaUuid, mediaType }: RelatedTitlesProps) => {
  const related = await listRelatedTitles(mediaUuid, mediaType);
  return (
    <TitleRail
      heading="More like this"
      reason="Sharing the most genres with this one."
      titles={related}
    />
  );
};
