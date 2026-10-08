import { Star } from "lucide-react";
import { CatalogCard } from "services";
import { Poster } from "ui";
import { GuideMark } from "@/components/ask/guide-mark";
import { MEDIA_TYPE_LABELS } from "@/db/label";

type AskDemoProps = {
  /** The highest rated titles of one medium, so every reason in the still is true. */
  picks: CatalogCard[];
};

/**
 * A still of the guide: a member's question, its answer, and its picks as
 * poster rows, drawn like the real conversation. The picks are the
 * catalog's best scored, which is exactly what the example asks for.
 */
export const AskDemo = ({ picks }: AskDemoProps) => (
  <div className="flex flex-col gap-5">
    <p className="ms-auto max-w-xs rounded-card border border-hairline bg-surface-2 px-4 py-2.5 text-sm text-ink">
      The best anime I haven’t seen yet?
    </p>
    <div className="flex gap-3">
      <GuideMark />
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1">
        <p className="text-sm leading-relaxed text-secondary">
          Here are the highest rated anime in Mediary that aren’t in your library. Start with the first; the others go
          deeper.
        </p>
        <ul className="flex flex-col gap-2">
          {picks.map((title) => (
            <li key={title.uuid} className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-2.5">
              <div className="w-11 shrink-0">
                <Poster src={title.coverUrl} alt="" sizes="44px" radius="control" dominantColor={title.dominantColor} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-1 text-sm font-medium text-ink">{title.canonicalTitle}</span>
                <span className="flex items-center gap-2 text-xs text-faint">
                  {MEDIA_TYPE_LABELS[title.mediaType]}
                  {title.releaseYear && <span>{title.releaseYear}</span>}
                  {title.providerScore !== null && (
                    <span className="tabular inline-flex items-center gap-1 text-secondary">
                      <Star size={11} className="fill-current text-warning" />
                      {title.providerScore.toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);
