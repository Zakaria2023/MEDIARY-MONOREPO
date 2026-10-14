"use client";

import { recordCreatorViewAction } from "./actions";

/**
 * A press on one of a creator's own links, counted for their dashboard. The
 * link itself goes straight to the address, so `rel="me"` still proves it is
 * theirs; the count rides along, and the tab it opens never waits for it.
 */
export const useCreatorLink = (userUuid: string, isCreator: boolean) => {
  const onClick = () => {
    if (isCreator) {
      void recordCreatorViewAction({ userUuid, kind: "link" });
    }
  };

  return { onClick };
};
