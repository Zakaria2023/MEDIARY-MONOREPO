"use client";

import { useSongListener } from "@/app/(app)/listen/use-song-listener";
import { ListenOrb } from "@/components/listen/listen-orb";
import { SongNotFound } from "@/components/listen/song-not-found";
import { SongResult } from "@/components/listen/song-result";

/** The listen page's working part: the orb, then what the last clip turned out to be. */
export const SongListener = () => {
  const { state, phase, progress, micError, listen, cancel } = useSongListener();
  const error = micError ?? (phase === "idle" ? state.error : undefined);

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <ListenOrb phase={phase} progress={progress} onListen={listen} onCancel={cancel} />
      {error && (
        <p role="alert" className="w-full rounded-card border border-hairline bg-danger-tint px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
      {phase === "idle" && !error && state.match && <SongResult match={state.match} />}
      {phase === "idle" && !error && state.match === null && <SongNotFound />}
    </div>
  );
};
