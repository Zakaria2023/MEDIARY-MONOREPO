import { CatalogCard } from "services";
import { Poster } from "ui";
import { MatchRing } from "@/components/compare/match-ring";
import { DemoFrame } from "@/components/landing/demo-frame";

type MatchDemoProps = {
  /** The favorites the two people share in the still. */
  shared: CatalogCard[];
};

const AVATAR = "inline-flex size-16 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold";

/**
 * A still of Taste Match: two people, how much their tastes agree as the
 * gradient ring (one of its permitted places), and the favorites they
 * share underneath.
 */
export const MatchDemo = ({ shared }: MatchDemoProps) => (
  <DemoFrame caption="An example match">
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4 sm:gap-8">
        <span className={`${AVATAR} bg-accent-tint text-accent`}>SA</span>
        <MatchRing value={87} />
        <span className={`${AVATAR} bg-magenta-tint text-magenta`}>LK</span>
      </div>
      <div className="flex w-full flex-col gap-3">
        <span className="text-center text-xs font-medium uppercase tracking-wide text-faint">You both loved</span>
        <div className="grid grid-cols-4 gap-3">
          {shared.slice(0, 4).map((title) => (
            <Poster key={title.uuid} src={title.coverUrl} alt="" sizes="120px" dominantColor={title.dominantColor} />
          ))}
        </div>
      </div>
    </div>
  </DemoFrame>
);
