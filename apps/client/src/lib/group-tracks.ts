import { MusicTrack } from "@/db/types";

/** One disc of a record and its songs, in order. */
export type TrackDisc = {
  disc: number;
  tracks: MusicTrack[];
};

/** A record's songs by disc, each disc in order; most records come back as one. */
export const groupTracksByDisc = (tracks: MusicTrack[]): TrackDisc[] => {
  const discs = new Map<number, MusicTrack[]>();
  for (const track of tracks) {
    discs.set(track.disc, [...(discs.get(track.disc) ?? []), track]);
  }
  return [...discs.entries()]
    .sort(([a], [b]) => a - b)
    .map(([disc, list]) => ({ disc, tracks: [...list].sort((a, b) => a.position - b.position) }));
};

/** The whole record's length in seconds, from the songs whose length is known. */
export const totalTrackSeconds = (tracks: MusicTrack[]): number =>
  tracks.reduce((sum, track) => sum + (track.lengthSeconds ?? 0), 0);
