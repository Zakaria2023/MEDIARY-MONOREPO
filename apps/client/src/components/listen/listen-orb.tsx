import { AudioLines, LoaderCircle, X } from "lucide-react";

type ListenOrbProps = {
  phase: "idle" | "listening" | "matching";
  /** 0 to 1 through the clip. */
  progress: number;
  onListen: () => void;
  onCancel: () => void;
};

const STATUS: Record<ListenOrbProps["phase"], string> = {
  idle: "Tap to listen",
  listening: "Listening…",
  matching: "Finding the song…",
};

/**
 * The one control on the page: a large round button that listens, rings
 * that pulse while it does (still under reduced motion), and the clip's
 * progress under it.
 */
export const ListenOrb = ({ phase, progress, onListen, onCancel }: ListenOrbProps) => (
  <div className="flex flex-col items-center gap-6">
    <div className="relative flex size-44 items-center justify-center sm:size-52">
      {phase === "listening" && (
        <>
          <span aria-hidden className="absolute inset-0 rounded-full bg-accent-tint motion-safe:animate-ping" />
          <span aria-hidden className="absolute inset-4 rounded-full bg-accent-tint" />
        </>
      )}
      <button
        type="button"
        onClick={phase === "listening" ? onCancel : onListen}
        disabled={phase === "matching"}
        aria-label={phase === "listening" ? "Stop listening" : "Listen to a song"}
        className={`relative flex size-32 items-center justify-center rounded-full border transition-colors sm:size-36 ${
          phase === "idle"
            ? "border-hairline-strong bg-surface text-ink hover:border-accent hover:text-accent"
            : "border-accent bg-surface-2 text-accent"
        } focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-80`}
      >
        {phase === "matching" ? (
          <LoaderCircle size={40} className="motion-safe:animate-spin" />
        ) : phase === "listening" ? (
          <X size={36} />
        ) : (
          <AudioLines size={44} />
        )}
      </button>
    </div>
    <div className="flex w-48 flex-col items-center gap-3">
      <span aria-live="polite" className="text-sm font-medium text-ink">
        {STATUS[phase]}
      </span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
        <div
          className="h-full rounded-full bg-accent transition-all duration-200 ease-linear"
          style={{ width: `${Math.round((phase === "matching" ? 1 : progress) * 100)}%` }}
        />
      </div>
    </div>
  </div>
);
