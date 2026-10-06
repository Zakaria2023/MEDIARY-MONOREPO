"use client";

import { useRouter } from "next/navigation";

/** The decorated destination the identity service hands back after a session is set. */
type NavigateParams = {
  decorateUrl: (url: string) => string;
};

/**
 * The navigate callback a finished sign-in or sign-up passes to `finalize`:
 * the session is active, so go to `destination`. The service may decorate
 * the URL (a cross-domain handshake); an absolute one is a full navigation,
 * a path is a client one.
 */
export const useFinishSession = () => {
  const router = useRouter();

  return (destination: string) =>
    ({ decorateUrl }: NavigateParams) => {
      const url = decorateUrl(destination);
      if (url.startsWith("http")) {
        window.location.href = url;
        return;
      }
      router.push(url);
      router.refresh();
    };
};
