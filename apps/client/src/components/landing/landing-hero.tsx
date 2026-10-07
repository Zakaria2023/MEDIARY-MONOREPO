import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type LandingHeroProps = {
  /** The poster wall, streamed in behind the words. */
  backdrop: ReactNode;
  /** The live catalog line under the actions, streamed in too. */
  proof: ReactNode;
};

const MEDIA_LINE = ["Anime", "Games", "Movies", "TV", "Music", "Manga", "Books"];

/**
 * THE FIRST SCREEN for a visitor. The promise, the two ways in and the
 * media line render on the server in the first bytes; the poster wall of
 * real titles drifts behind them once it streams. One of the gradient's
 * permitted places: the glow and the last words of the headline.
 */
export const LandingHero = ({ backdrop, proof }: LandingHeroProps) => (
  <section className="relative isolate overflow-hidden border-b border-hairline">
    <div className="absolute inset-0 -z-20">{backdrop}</div>
    <div className="absolute inset-0 -z-10 bg-page/75" />
    <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-backdrop-fade" />
    <div className="absolute inset-x-0 top-0 -z-10 h-32 rotate-180 bg-backdrop-fade" />
    <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-96 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-gradient-soft opacity-80 blur-3xl" />

    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center gap-8 px-5 py-24 text-center sm:px-8">
      <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-chip border border-hairline-strong bg-surface/70 px-4 py-1.5 text-xs font-medium text-secondary backdrop-blur-md">
        <Sparkles size={13} className="text-accent" />
        {MEDIA_LINE.map((medium, index) => (
          <span key={medium} className="inline-flex items-center gap-2">
            {index > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-faint" />}
            {medium}
          </span>
        ))}
      </p>

      <h1 className="font-display text-5xl font-semibold leading-none tracking-tight text-ink sm:text-6xl lg:text-7xl xl:text-8xl">
        <span className="sm:whitespace-nowrap">Everything you love,</span>
        <br />
        <span className="text-brand-gradient">one story.</span>
      </h1>

      <p className="max-w-2xl text-pretty text-lg leading-relaxed text-secondary sm:text-xl">
        Track every episode, playthrough, chapter and album in one place. Mediary turns what you watch, play, read and hear into a diary, stats
        and a profile that finally looks like you.
      </p>

      <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Link
          href="/sign-up"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-control bg-action-gradient px-7 text-base font-medium text-white"
        >
          Create your Mediary
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/explore"
          className="inline-flex h-14 items-center justify-center rounded-control border border-hairline-strong bg-surface/60 px-7 text-base font-medium text-ink backdrop-blur-md transition-colors hover:bg-hover"
        >
          Explore the catalog
        </Link>
      </div>

      {proof}
    </div>
  </section>
);
