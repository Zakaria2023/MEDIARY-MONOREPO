"use client";

import { ArrowLeft, Check, Download } from "lucide-react";
import Link from "next/link";
import { LibraryImport } from "services";
import { Button, FormError } from "ui";
import { formatCount } from "utils";
import { IMPORT_SOURCE_LABELS } from "@/db/label";
import { useApplyImport } from "@/app/(app)/settings/imports/[uuid]/use-apply-import";
import { StatTile } from "@/components/shared/stat-tile";

type ImportPreviewProps = {
  initial: LibraryImport;
};

/**
 * The top of an import's page: what the file held, what was found, and
 * the one button that puts it in the library. After that, what happened.
 */
export const ImportPreview = ({ initial }: ImportPreviewProps) => {
  const { summary, error, isPending, onApply } = useApplyImport(initial);
  const applied = summary.status === "applied";
  const unmatched = summary.itemCount - summary.matchedCount - summary.skippedCount - (applied ? summary.createdCount : 0);

  return (
    <section className="flex flex-col gap-5">
      <Link href="/settings/imports" className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink">
        <ArrowLeft size={15} />
        All imports
      </Link>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">{summary.fileName}</h2>
        <p className="text-sm text-muted">{IMPORT_SOURCE_LABELS[summary.source]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="In the file" value={formatCount(summary.itemCount)} />
        {applied ? (
          <StatTile label="Added" value={formatCount(summary.createdCount)} detail="Now in your library" />
        ) : (
          <StatTile label="Found" value={formatCount(summary.matchedCount)} detail="Ready to add" />
        )}
        <StatTile label="Already yours" value={formatCount(summary.skippedCount)} detail="Left as they are" />
        <StatTile label="Not in the catalog" value={formatCount(Math.max(0, unmatched))} detail="Kept for later" />
      </div>

      <FormError message={error} />
      {applied ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <Check size={16} />
          Imported. Everything added is in your library and diary.
        </p>
      ) : summary.matchedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onApply} disabled={isPending}>
            <Download size={16} />
            {isPending ? "Importing" : `Import ${formatCount(summary.matchedCount)} ${summary.matchedCount === 1 ? "title" : "titles"}`}
          </Button>
          <span className="text-sm text-muted">Each title gets one diary line, dated by the file where it says.</span>
        </div>
      ) : (
        <p className="text-sm text-muted">Nothing in this file is in the catalog yet, so there is nothing to add.</p>
      )}
    </section>
  );
};
