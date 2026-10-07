import { PlatformCount } from "services";

type PlatformBarsProps = {
  platforms: PlatformCount[];
};

/** Games by the platform they are tracked on, as bars against the biggest. */
export const PlatformBars = ({ platforms }: PlatformBarsProps) => {
  const max = Math.max(1, ...platforms.map((platform) => platform.count));

  if (platforms.length === 0) {
    return <p className="text-sm text-muted">Pick a platform in the sheet of a game and they show up here.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {platforms.map((platform) => (
        <li key={platform.name} className="flex items-center gap-3 text-sm">
          <span className="w-24 shrink-0 text-secondary">{platform.name}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-chip bg-hairline">
            <div className="h-full rounded-chip bg-violet" style={{ width: `${(platform.count / max) * 100}%` }} />
          </div>
          <span className="tabular w-8 text-end text-ink">{platform.count}</span>
        </li>
      ))}
    </ul>
  );
};
