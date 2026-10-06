import type { MockTitle } from "@/lib/design/mock";

type PosterArtProps = {
  title: MockTitle;
  /** `backdrop` is the 16:9 crop a detail hero uses. */
  shape?: "poster" | "backdrop";
  className?: string;
};

/**
 * PLACEHOLDER ARTWORK FOR THE PROTOTYPES. A real poster comes from the
 * catalog; until then the box is painted from the title's dominant color,
 * which is also what the real card shows in the instant before its image
 * lands. The title is set small in the corner so a grid of these still reads
 * as a grid of different things.
 */
export const PosterArt = ({
  title,
  shape = "poster",
  className = "",
}: PosterArtProps) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden ${
      shape === "poster" ? "aspect-poster rounded-card" : "aspect-backdrop"
    } ${className}`}
    style={{
      backgroundColor: title.color,
      backgroundImage: `radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.55) 100%)`,
    }}
  >
    <span className="absolute inset-x-3 bottom-3 line-clamp-2 font-display text-xs leading-snug text-white/80">
      {title.title}
    </span>
  </div>
);
