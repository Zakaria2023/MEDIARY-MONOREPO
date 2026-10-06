"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ImportCandidate } from "services";
import { ProviderSearchInput, providerSearchSchema } from "validators";
import { ImportSource } from "@/lib/import-sources";
import { importTitleAction, searchProviderAction } from "./actions";

/** The source a form starts on: the first one that is configured. */
const firstUsable = (sources: ImportSource[]): ImportSource => {
  const source = sources.find((entry) => entry.configured) ?? sources[0];
  if (!source) {
    throw new Error("No catalog source is registered");
  }
  return source;
};

/**
 * The import screen's search: pick a source, type a name, see the provider's
 * hits with the ones already in the catalog marked, and import any other in
 * one click. Imports accumulate in the action's state, so a row flips to
 * "In catalog" the moment its import lands.
 */
export const useProviderSearch = (sources: ImportSource[]) => {
  const start = firstUsable(sources);
  const [state, dispatch, isPending] = useActionState(searchProviderAction, {});
  const [importState, dispatchImport, isImporting] = useActionState(importTitleAction, {
    imported: {},
  });
  const [importingId, setImportingId] = useState<string | null>(null);

  const form = useForm<ProviderSearchInput>({
    resolver: zodResolver(providerSearchSchema),
    defaultValues: { provider: start.provider, mediaType: start.mediaType, query: "" },
  });
  const provider = useWatch({ control: form.control, name: "provider" });
  const mediaType = useWatch({ control: form.control, name: "mediaType" });
  const source = sources.find((entry) => entry.value === `${provider}:${mediaType}`) ?? start;

  const onSourceChange = (value: string) => {
    const next = sources.find((entry) => entry.value === value);
    if (next) {
      form.setValue("provider", next.provider);
      form.setValue("mediaType", next.mediaType);
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const importCandidate = (candidate: ImportCandidate) => {
    setImportingId(candidate.externalId);
    startTransition(() => {
      dispatchImport({
        provider: candidate.provider,
        mediaType: candidate.mediaType,
        externalId: candidate.externalId,
      });
    });
  };

  /** The catalog title a hit is, from the search or from an import since. */
  const catalogEntryOf = (candidate: ImportCandidate) =>
    importState.imported[`${candidate.provider}:${candidate.externalId}`] ??
    candidate.inCatalog;

  return {
    form,
    state,
    isPending,
    onSubmit,
    source,
    onSourceChange,
    importCandidate,
    importError: importState.error,
    importingId: isImporting ? importingId : null,
    catalogEntryOf,
  };
};
