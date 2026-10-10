import { formatCount } from "utils";
import { readLandingCounts } from "@/lib/server/landing-catalog";

/**
 * The line under the hero's actions: how big the catalog really is, read
 * from it, so the claim is never stale. Nothing is said while it is empty.
 */
export const CatalogProof = async () => {
  const counts = await readLandingCounts();
  const total = Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0);
  if (total === 0) {
    return null;
  }
  const media = Object.values(counts).filter((count) => (count ?? 0) > 0).length;

  return (
    <p className="text-sm text-muted">
      <span className="tabular font-medium text-ink">{formatCount(total)}</span> titles across{" "}
      <span className="tabular font-medium text-ink">{media}</span> media, free, and yours to take with you.
    </p>
  );
};
