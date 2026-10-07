import { ReactNode } from "react";

type AboutHeroProps = {
  /** The poster mosaic on the end side, streamed in. */
  mosaic: ReactNode;
};

/**
 * The about page's opening: the page's h1 and the one-paragraph answer to
 * "what is this", beside a mosaic of real titles across the media. The
 * words render on the server; the mosaic streams.
 */
export const AboutHero = ({ mosaic }: AboutHeroProps) => (
  <section className="relative isolate overflow-hidden border-b border-hairline">
    <div aria-hidden className="absolute -right-40 top-0 -z-10 h-96 w-96 rounded-full bg-brand-gradient-soft opacity-70 blur-3xl" />
    <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-20">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">About Mediary</p>
        <h1 className="text-balance font-display text-5xl font-semibold leading-none tracking-tight text-ink sm:text-7xl">
          Your taste deserves <span className="text-brand-gradient">one home.</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-secondary">
          Mediary is a tracker for everything you watch, play, read and hear. One profile instead of five apps, one history instead of scattered
          lists, and a design that treats your story like it matters.
        </p>
      </div>
      <div aria-hidden className="relative">
        {mosaic}
      </div>
    </div>
  </section>
);
