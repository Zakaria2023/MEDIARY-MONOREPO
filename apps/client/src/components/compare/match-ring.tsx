type MatchRingProps = {
  /** Null while too little is shared for a number. */
  value: number | null;
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The overall match as a ring, the number in the middle. The arc is the
 * brand gradient: Taste Match is a share moment and one of the gradient's
 * four permitted uses. Without a number yet, an empty ring that says so.
 */
export const MatchRing = ({ value }: MatchRingProps) => (
  <div className="relative flex h-36 w-36 items-center justify-center">
    <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
      <defs>
        <linearGradient id="match-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1697ff" />
          <stop offset="50%" stopColor="#7b2cff" />
          <stop offset="100%" stopColor="#d815ff" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r={RADIUS} fill="none" strokeWidth="8" className="stroke-hairline" />
      <circle
        cx="64"
        cy="64"
        r={RADIUS}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        stroke="url(#match-ring)"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - (value ?? 0) / 100)}
      />
    </svg>
    <div className="flex flex-col items-center">
      {value === null ? (
        <>
          <span className="font-display text-xl text-ink">Too early</span>
          <span className="text-xs text-muted">to call it</span>
        </>
      ) : (
        <>
          <span className="tabular font-display text-4xl font-semibold text-ink">{value}%</span>
          <span className="text-xs text-muted">match</span>
        </>
      )}
    </div>
  </div>
);
