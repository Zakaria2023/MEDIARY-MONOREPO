import { Metadata } from "next";
import { isSongMatchReady } from "services";
import { ListenUnavailable } from "@/components/listen/listen-unavailable";
import { SongListener } from "@/components/listen/song-listener";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Name that song",
  description: "Let Mediary listen to what's playing and find the record it's on.",
  path: "/listen",
  noIndex: true,
});

/** NAME THAT SONG: a few seconds from the microphone, the song, and the record in Mediary. */
const ListenPage = () => (
  <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-10 px-5 py-10 text-center sm:px-8 sm:py-14">
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Name that song</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        Hold your phone near the music. Mediary listens for a few seconds and finds the record.
      </p>
    </div>
    <div className="flex w-full flex-col items-center text-start">
      {isSongMatchReady() ? <SongListener /> : <ListenUnavailable />}
    </div>
  </main>
);

export default ListenPage;
