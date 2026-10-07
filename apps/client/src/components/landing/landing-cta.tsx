import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type LandingCtaProps = {
  heading: string;
  body: string;
};

/**
 * The closing invitation, on the landing and the about page: the mark,
 * one line, and the button. Flat surface and hairline; the color comes
 * from the logo and the button, nothing else.
 */
export const LandingCta = ({ heading, body }: LandingCtaProps) => (
  <section className="mx-auto w-full max-w-7xl px-5 sm:px-8">
    <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-card border border-hairline bg-surface px-6 py-16 text-center sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-40" />
      <Image src="/brand/mediary-mark.png" alt="" width={72} height={72} className="relative" />
      <div className="relative flex max-w-2xl flex-col gap-4">
        <h2 className="text-balance font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">{heading}</h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">{body}</p>
      </div>
      <div className="relative flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <Link
          href="/sign-up"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-control bg-action-gradient px-7 text-base font-medium text-white"
        >
          Create your Mediary
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/explore"
          className="inline-flex h-14 items-center justify-center rounded-control border border-hairline-strong px-7 text-base font-medium text-ink transition-colors hover:bg-hover"
        >
          Explore first
        </Link>
      </div>
    </div>
  </section>
);
