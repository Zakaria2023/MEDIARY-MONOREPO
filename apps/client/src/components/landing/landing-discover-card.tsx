import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type LandingDiscoverCardProps = {
  icon: ReactNode;
  title: string;
  body: string;
  points: string[];
  href: string;
  action: string;
  /** The still of the feature, drawn like the real screen. */
  visual: ReactNode;
  className?: string;
};

/**
 * One of the two ways to find what's next: its words and a link on top,
 * then the still of it on a dot grid, filling the rest of the card so the
 * two cards stand the same height side by side.
 */
export const LandingDiscoverCard = ({ icon, title, body, points, href, action, visual, className = "" }: LandingDiscoverCardProps) => (
  <article className={`flex flex-col overflow-hidden rounded-card border border-hairline bg-surface ${className}`}>
    <div className="flex flex-col gap-5 p-6 sm:p-8">
      <span className="flex size-11 items-center justify-center rounded-control bg-accent-tint text-accent">{icon}</span>
      <div className="flex flex-col gap-3">
        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h3>
        <p className="text-pretty text-base leading-relaxed text-muted">{body}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-sm text-secondary">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
              <Check size={12} strokeWidth={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="group flex w-fit items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
      >
        {action}
        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
    <div aria-hidden className="relative mt-auto border-t border-hairline bg-page/60 p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60" />
      <div className="relative">{visual}</div>
    </div>
  </article>
);
