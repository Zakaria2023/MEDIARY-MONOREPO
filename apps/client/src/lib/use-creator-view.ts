"use client";

import { useEffect } from "react";
import { CreatorViewInput } from "validators";
import { recordCreatorViewAction } from "@/app/(site)/profile/[username]/actions";

/**
 * Counts one open of a creator's profile, list or taste comparison, from the
 * browser once the page is really shown, so a prefetch or a crawler's render
 * counts nothing. The server keeps repeats, programs and the creator out.
 */
export const useCreatorView = ({ userUuid, kind }: CreatorViewInput) => {
  useEffect(() => {
    void recordCreatorViewAction({ userUuid, kind });
  }, [userUuid, kind]);
};
