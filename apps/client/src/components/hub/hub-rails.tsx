import { LaunchMediaType } from "@/db/enum";
import { TitleRail } from "@/components/catalog/title-rail";
import { HUB_COPY } from "@/lib/hub-copy";
import { listCatalog } from "@/lib/server/catalog-cache";

type HubRailsProps = {
  mediaType: LaunchMediaType;
};

const RAIL_SIZE = 16;

/** The medium's own two rails, each with its own order. An empty rail is not drawn. */
export const HubRails = async ({ mediaType }: HubRailsProps) => {
  const copy = HUB_COPY[mediaType];
  const [first, second] = await Promise.all(
    copy.rails.map((rail) => listCatalog({ mediaType, sort: rail.sort, pageSize: RAIL_SIZE })),
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <TitleRail heading={copy.rails[0].heading} reason={copy.rails[0].reason} titles={first?.items ?? []} />
      <TitleRail heading={copy.rails[1].heading} reason={copy.rails[1].reason} titles={second?.items ?? []} />
    </div>
  );
};
