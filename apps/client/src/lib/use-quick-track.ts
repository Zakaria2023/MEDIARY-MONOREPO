"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { TitleTracking } from "services";
import { loadTrackingAction } from "@/app/(app)/library/actions";

/**
 * THE QUICK ADD ON A CARD. Whether there is a member is the identity
 * service's own client state, so the many server pages that draw cards pass
 * nothing down. Each press asks the server for the title and the member's
 * entry afresh and opens the sheet on it; `opened` remounts the sheet so it
 * starts from what the server just said.
 */
export const useQuickTrack = (mediaUuid: string) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [tracking, setTracking] = useState<TitleTracking | null>(null);
  const [opened, setOpened] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();

  const onOpen = () => {
    setError(null);
    startLoading(async () => {
      const result = await loadTrackingAction(mediaUuid);
      if (result.tracking) {
        setTracking(result.tracking);
        setOpened((count) => count + 1);
        return;
      }
      setError(result.error ?? "Could not open this title");
    });
  };

  return { isVisitor: isLoaded && !isSignedIn, tracking, opened, error, isLoading, onOpen };
};
