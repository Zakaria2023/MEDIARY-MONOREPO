type Swatch = {
  token: string;
  className: string;
  note: string;
};

const SURFACES: Swatch[] = [
  { token: "page", className: "bg-page", note: "The canvas" },
  { token: "surface", className: "bg-surface", note: "Cards, menus, sheets" },
  { token: "surface-2", className: "bg-surface-2", note: "A band that recedes, a selected tab" },
  { token: "overlay", className: "bg-overlay", note: "Portaled menus and dialogs" },
  { token: "hover", className: "bg-hover", note: "A row under the pointer" },
];

const BRAND: Swatch[] = [
  { token: "primary", className: "bg-primary", note: "The one button per screen" },
  { token: "accent", className: "bg-accent", note: "Focus, links, selected" },
  { token: "violet", className: "bg-violet", note: "Depth, charts" },
  { token: "magenta", className: "bg-magenta", note: "Taste features" },
  { token: "pink", className: "bg-pink", note: "Share moments" },
];

const STATUS: Swatch[] = [
  { token: "status-progress", className: "bg-status-progress", note: "Watching, Playing, Reading" },
  { token: "status-completed", className: "bg-status-completed", note: "Completed, Watched, Read" },
  { token: "status-paused", className: "bg-status-paused", note: "On Hold, Paused" },
  { token: "status-dropped", className: "bg-status-dropped", note: "Dropped, DNF" },
  { token: "status-planned", className: "bg-status-planned", note: "Planned, Watchlist" },
];

const TEXT: Swatch[] = [
  { token: "ink", className: "bg-ink", note: "Primary text" },
  { token: "secondary", className: "bg-secondary", note: "Body copy on a card" },
  { token: "muted", className: "bg-muted", note: "Secondary text" },
  { token: "faint", className: "bg-faint", note: "Labels, timestamps" },
  { token: "placeholder", className: "bg-placeholder", note: "Empty input text" },
];

type SwatchRowProps = {
  title: string;
  swatches: Swatch[];
};

const SwatchRow = ({ title, swatches }: SwatchRowProps) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-xs font-medium uppercase tracking-wide text-faint">{title}</h3>
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {swatches.map((swatch) => (
        <li key={swatch.token} className="flex flex-col gap-2">
          <div className={`h-14 rounded-control border border-hairline ${swatch.className}`} />
          <span className="font-mono text-xs text-ink">{swatch.token}</span>
          <span className="text-xs text-muted">{swatch.note}</span>
        </li>
      ))}
    </ul>
  </div>
);

/** Every color token, as a swatch with the job it does. */
export const TokenSwatches = () => (
  <div className="flex flex-col gap-8">
    <SwatchRow title="Surfaces" swatches={SURFACES} />
    <SwatchRow title="Brand" swatches={BRAND} />
    <SwatchRow title="Tracking status" swatches={STATUS} />
    <SwatchRow title="Text" swatches={TEXT} />
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-faint">
        The brand gradient, in its four places only
      </h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex h-14 items-center justify-center rounded-control bg-brand-gradient text-sm font-medium text-white">
          Landing hero
        </div>
        <div className="flex h-14 items-center justify-center rounded-control border border-hairline bg-surface">
          <span className="font-display text-lg font-semibold text-brand-gradient">Share card</span>
        </div>
        <div className="flex h-14 items-center rounded-control border border-hairline bg-surface px-4">
          <div className="h-2 w-full overflow-hidden rounded-chip bg-hairline">
            <div className="h-full w-3/4 rounded-chip bg-brand-gradient" />
          </div>
        </div>
        <div className="flex h-14 items-center justify-center rounded-control bg-brand-gradient-soft text-sm text-ink">
          Selected state
        </div>
      </div>
    </div>
  </div>
);
