import Link from "next/link";
import { countCatalogByType } from "services";
import { launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

const FORMAT = new Intl.NumberFormat("en-US");

/**
 * Titles per medium, each a link into the catalog filtered to it. A medium
 * at zero says so, which is how a missing provider shows up on day one.
 */
export const CatalogBreakdown = async () => {
  const counts = await countCatalogByType();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {launchMediaTypes.map((type) => (
        <Link
          key={type}
          href={`/catalog?type=${type}`}
          className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-5 transition-colors hover:border-hairline-strong"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-faint">
            {MEDIA_TYPE_PLURAL_LABELS[type]}
          </span>
          <span className="tabular font-display text-2xl font-semibold text-ink">
            {FORMAT.format(counts[type] ?? 0)}
          </span>
        </Link>
      ))}
    </div>
  );
};
