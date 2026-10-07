import { Download } from "lucide-react";

type ExportLink = {
  kind: "library" | "diary";
  label: string;
  description: string;
};

const FILES: ExportLink[] = [
  { kind: "library", label: "Library", description: "Every title with its status, score, progress, dates and notes. Mediary can import this file again." },
  { kind: "diary", label: "Diary", description: "Every moment you logged, newest first, with what changed." },
];

/**
 * Your history is yours: two CSV files, readable in any spreadsheet and
 * taken anywhere. Plain links, because a download is a page the browser
 * fetches, not a form it submits.
 */
export const ExportData = () => (
  <section className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6">
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-lg text-ink">Export your data</h2>
      <p className="text-sm text-muted">Download what you have tracked. Nothing is removed; the files are a copy.</p>
    </div>
    <ul className="flex flex-col divide-y divide-hairline-soft">
      {FILES.map((file) => (
        <li key={file.kind} className="flex items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-ink">{file.label}</span>
            <span className="text-sm text-muted">{file.description}</span>
          </div>
          <a
            href={`/settings/account/export?kind=${file.kind}`}
            download
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-control border border-hairline-strong px-3 text-sm font-medium text-ink transition-colors hover:bg-hover"
          >
            <Download size={15} />
            CSV
          </a>
        </li>
      ))}
    </ul>
  </section>
);
