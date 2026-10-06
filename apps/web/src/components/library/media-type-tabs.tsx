"use client";

import { useState } from "react";
import { Tabs } from "ui";

type MediaTypeTab = "all" | "anime" | "game" | "movie" | "tv";

/**
 * The medium filter above the library. Holds its own value in the
 * prototype; in the product the value lives in the URL so a filtered
 * library can be linked to.
 */
export const MediaTypeTabs = () => {
  const [type, setType] = useState<MediaTypeTab>("all");

  return (
    <Tabs
      value={type}
      onChange={setType}
      items={[
        { value: "all", label: "All" },
        { value: "anime", label: "Anime" },
        { value: "game", label: "Games" },
        { value: "movie", label: "Movies" },
        { value: "tv", label: "TV" },
      ]}
    />
  );
};
