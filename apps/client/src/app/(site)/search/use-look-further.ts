"use client";

import { startTransition, useActionState, useState } from "react";
import { FoundArtist, FoundTitle } from "services";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { bringInArtistAction, bringInTitleAction, lookFurtherAction } from "./actions";

type UseLookFurtherParams = {
  query: string;
  mediaType: LaunchMediaType | undefined;
};

type FoundGroup = {
  mediaType: LaunchMediaType;
  titles: FoundTitle[];
};

/**
 * LOOKING FURTHER from the search page: one press asks every source live,
 * the hits come back grouped by medium in the site's own order, and each
 * one not held yet can be brought in. A bring-in ends on the new page, so
 * the hook only has to remember which row is working and any refusal.
 */
export const useLookFurther = ({ query, mediaType }: UseLookFurtherParams) => {
  const [lookState, look, isLooking] = useActionState(lookFurtherAction, {});
  const [titleState, bringTitle, isBringingTitle] = useActionState(bringInTitleAction, {});
  const [artistState, bringArtist, isBringingArtist] = useActionState(bringInArtistAction, {});
  const [workingKey, setWorkingKey] = useState<string | null>(null);

  const result = lookState.result;
  const groups: FoundGroup[] = launchMediaTypes
    .map((type) => ({ mediaType: type, titles: (result?.found ?? []).filter((title) => title.mediaType === type) }))
    .filter((group) => group.titles.length > 0);
  const isBringing = isBringingTitle || isBringingArtist;

  const onLook = () => {
    startTransition(() => {
      look({ query, mediaType });
    });
  };

  const onBringTitle = (title: FoundTitle, type: LaunchMediaType) => {
    setWorkingKey(`${title.provider}:${title.externalId}`);
    startTransition(() => {
      bringTitle({ provider: title.provider, mediaType: type, externalId: title.externalId });
    });
  };

  const onBringArtist = (artist: FoundArtist) => {
    setWorkingKey(`artist:${artist.mbid}`);
    startTransition(() => {
      bringArtist({ mbid: artist.mbid });
    });
  };

  return {
    onLook,
    isLooking,
    looked: Boolean(result),
    lookError: lookState.error,
    groups,
    artists: result?.artists ?? [],
    unanswered: result?.unanswered ?? [],
    onBringTitle,
    onBringArtist,
    workingKey: isBringing ? workingKey : null,
    isBringing,
    bringError: titleState.error ?? artistState.error,
  };
};
