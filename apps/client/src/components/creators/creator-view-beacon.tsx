"use client";

import { CreatorViewInput } from "validators";
import { useCreatorView } from "@/lib/use-creator-view";

type CreatorViewBeaconProps = CreatorViewInput;

/** Counts a view on a verified creator's behalf and draws nothing. Rendered only for a creator. */
export const CreatorViewBeacon = ({ userUuid, kind }: CreatorViewBeaconProps) => {
  useCreatorView({ userUuid, kind });
  return null;
};
