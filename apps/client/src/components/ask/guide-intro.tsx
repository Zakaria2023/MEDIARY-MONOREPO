import { ArrowUpRight } from "lucide-react";
import { GuideMark } from "@/components/ask/guide-mark";
import { GUIDE_SUGGESTIONS } from "@/lib/guide-suggestions";

type GuideIntroProps = {
  onAsk: (message: string) => void;
  disabled: boolean;
};

/** The empty conversation: what the guide does, and a few ways to start. */
export const GuideIntro = ({ onAsk, disabled }: GuideIntroProps) => (
  <div className="flex animate-fade-in flex-col items-start gap-8 py-6 sm:py-10">
    <div className="flex flex-col gap-4">
      <GuideMark />
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        What are you in the mood for?
      </h2>
      <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        Tell the guide what you loved, how much time you have or the feeling you’re after. It looks across every
        medium in Mediary and leaves out what’s already in your library.
      </p>
    </div>
    <ul className="grid w-full gap-2 sm:grid-cols-2">
      {GUIDE_SUGGESTIONS.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAsk(suggestion)}
            className="group flex w-full items-center justify-between gap-3 rounded-card border border-hairline bg-surface px-4 py-3 text-start text-sm text-secondary transition-colors hover:border-hairline-strong hover:text-ink disabled:opacity-60"
          >
            {suggestion}
            <ArrowUpRight size={16} className="shrink-0 text-faint transition-colors group-hover:text-accent" />
          </button>
        </li>
      ))}
    </ul>
  </div>
);
