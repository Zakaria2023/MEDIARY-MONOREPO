import { Check } from "lucide-react";
import { ReactNode } from "react";

type LandingFeatureRowProps = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  /** The illustration: a still of the product, drawn from real titles. */
  visual: ReactNode;
  /** Puts the illustration first on wide screens, so rows alternate. */
  reverse?: boolean;
};

/**
 * One feature of the product: the words on one side, a still of the thing
 * itself on the other, alternating down the page. On a phone the words come
 * first and the still follows.
 */
export const LandingFeatureRow = ({ eyebrow, title, body, points, visual, reverse = false }: LandingFeatureRowProps) => (
  <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
    <div className={`flex flex-col gap-6 ${reverse ? "lg:order-2" : ""}`}>
      <div className="flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</p>
        <h3 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h3>
        <p className="text-base leading-relaxed text-muted sm:text-lg">{body}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3 text-sm text-secondary sm:text-base">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
              <Check size={12} strokeWidth={3} />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
    <div aria-hidden className={`relative ${reverse ? "lg:order-1" : ""}`}>
      {visual}
    </div>
  </div>
);
