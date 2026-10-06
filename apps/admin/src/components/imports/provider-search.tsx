"use client";

import { Search, SearchX } from "lucide-react";
import { Button, Dropdown, FormError, Input } from "ui";
import { useProviderSearch } from "@/app/(dashboard)/imports/use-provider-search";
import { CandidateRow } from "@/components/imports/candidate-row";
import { FieldLabel } from "@/components/shared/field-label";
import { ImportSource } from "@/lib/import-sources";

type ProviderSearchProps = {
  sources: ImportSource[];
};

/** Find one title at a provider and bring it into the catalog. */
export const ProviderSearch = ({ sources }: ProviderSearchProps) => {
  const {
    form,
    state,
    isPending,
    onSubmit,
    source,
    onSourceChange,
    importCandidate,
    importError,
    importingId,
    catalogEntryOf,
  } = useProviderSearch(sources);
  const candidates = state.candidates;

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
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
        <Input
          label="Title"
          placeholder="Search by name"
          icon={<Search size={16} />}
          error={form.formState.errors.query?.message}
          {...form.register("query")}
        />
        <Button type="submit" disabled={isPending} className="sm:mb-0.5">
          {isPending ? "Searching" : "Search"}
        </Button>
      </form>

      <FormError message={state.error ?? importError} />

      {candidates && candidates.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-hairline-strong px-6 py-10 text-center">
          <SearchX size={20} className="text-faint" />
          <p className="text-sm text-muted">
            {source.label.split(" · ")[0]} has nothing called &ldquo;{state.query}&rdquo;.
          </p>
        </div>
      )}

      {candidates && candidates.length > 0 && (
        <ul className="grid gap-2 lg:grid-cols-2">
          {candidates.map((candidate) => (
            <CandidateRow
              key={candidate.externalId}
              candidate={candidate}
              catalogEntry={catalogEntryOf(candidate)}
              importing={importingId === candidate.externalId}
              busy={importingId !== null}
              onImport={importCandidate}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
