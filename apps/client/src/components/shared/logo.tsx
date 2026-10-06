import { Play } from "lucide-react";

type LogoProps = {
  /** The wordmark beside the mark. Off on the tightest layouts. */
  wordmark?: boolean;
};

/**
 * THE MARK, as code until the real SVG from the brand file is dropped in: a
 * rounded tile on the brand gradient with the play glyph, beside the
 * wordmark. The gradient is one of its four permitted uses.
 */
export const Logo = ({ wordmark = true }: LogoProps) => (
  <span className="inline-flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-gradient text-white">
      <Play size={14} className="ms-0.5 fill-current" />
    </span>
    {wordmark && (
      <span className="font-display text-lg font-semibold tracking-tight text-ink">
        Mediary
      </span>
    )}
  </span>
);
