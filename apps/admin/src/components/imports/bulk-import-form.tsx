"use client";

import { DownloadCloud } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button, Dropdown, FormError, Input } from "ui";
import { useBulkImport } from "@/app/(dashboard)/imports/use-bulk-import";
import { ImportSummary } from "@/components/imports/import-summary";
import { FieldLabel } from "@/components/shared/field-label";
import { ImportSource } from "@/lib/import-sources";

type BulkImportFormProps = {
  sources: ImportSource[];
};

const LIST_OPTIONS = [
  { value: "trending", label: "Trending this week" },
  { value: "popular", label: "Popular" },
  { value: "top", label: "Highest rated" },
  { value: "upcoming", label: "Upcoming" },
];

const PAGE_OPTIONS = [1, 2, 3, 4, 5].map((pages) => ({
  value: String(pages),
  label: `${pages} ${pages === 1 ? "page" : "pages"} · ${pages * 20} titles`,
}));

/**
 * Fill the catalog from a provider list. A title synced in the last day is
 * skipped, so running the same import twice costs almost nothing, and the
 * start page moves on after each run so the next press goes deeper.
 */
export const BulkImportForm = ({ sources }: BulkImportFormProps) => {
  const { form, state, isPending, onSubmit, source, onSourceChange } = useBulkImport(sources);

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_180px_200px_120px_auto] lg:items-end"
      >
        <FieldLabel label="Source">
          <Dropdown
            value={source.value}
            onChange={onSourceChange}
            options={sources.map((entry) => ({
              value: entry.value,
              label: entry.configured ? entry.label : `${entry.label} (not configured)`,
            }))}
          />
        </FieldLabel>
        <FieldLabel label="List">
          <Controller
            control={form.control}
            name="list"
            render={({ field }) => (
              <Dropdown value={field.value} onChange={field.onChange} options={LIST_OPTIONS} />
            )}
          />
        </FieldLabel>
        <FieldLabel label="How much">
          <Controller
            control={form.control}
            name="pages"
            render={({ field }) => (
              <Dropdown
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                options={PAGE_OPTIONS}
              />
            )}
          />
        </FieldLabel>
        <Input
          label="From page"
          type="number"
          min={1}
          max={500}
          error={form.formState.errors.startPage?.message}
          {...form.register("startPage", { valueAsNumber: true })}
        />
        <Button type="submit" disabled={isPending} className="lg:mb-0.5">
          <DownloadCloud size={16} />
          {isPending ? "Importing" : "Import"}
        </Button>
      </form>

      {isPending && (
        <p className="text-sm text-muted">
          Importing. A page of twenty takes a few seconds for movies and TV, and longer for
          games, whose source allows only a few requests a second.
        </p>
      )}
      <FormError message={state.error} />
      {state.summary && <ImportSummary summary={state.summary} />}
    </div>
  );
};
