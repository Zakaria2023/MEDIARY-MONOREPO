import { listPlaythroughs, TrackingPlatform } from "services";
import { PlaythroughList } from "@/components/tracking/playthrough-list";

type PlaythroughsProps = {
  userUuid: string;
  mediaUuid: string;
  /** The platforms the game is on, for the picker. */
  platforms: TrackingPlatform[];
};

/**
 * A member's runs through a game they hold, read on the server and handed
 * to the panel that edits them. Rendered on a game's page only, under
 * the viewer's own entry.
 */
export const Playthroughs = async ({ userUuid, mediaUuid, platforms }: PlaythroughsProps) => {
  const runs = await listPlaythroughs(userUuid, mediaUuid);
  return <PlaythroughList mediaUuid={mediaUuid} platforms={platforms} initial={runs} />;
};
