"use server";

import { revalidatePath } from "next/cache";
import {
  ImportCandidate,
  importProviderList,
  importProviderTitle,
  ImportSummary,
  searchProviderCatalog,
} from "services";
import { ActionResult, fail } from "utils";
import {
  BulkImportInput,
  bulkImportSchema,
  ImportTitleInput,
  importTitleSchema,
  ProviderSearchInput,
  providerSearchSchema,
} from "validators";
import { requireAdmin, requireStaff } from "@/lib/auth";

export type ProviderSearchState = ActionResult & {
  candidates?: ImportCandidate[];
  query?: string;
};

/** Imported titles so far, keyed "provider:externalId", accumulated across imports. */
export type ImportTitleState = ActionResult & {
  imported: Record<string, { uuid: string; slug: string }>;
};

export type BulkImportState = ActionResult & {
  summary?: ImportSummary;
};

/** Searches a provider. Staff may look; only admins may import. */
export const searchProviderAction = async (
  _prevState: ProviderSearchState,
  input: ProviderSearchInput,
): Promise<ProviderSearchState> => {
  await requireStaff();
  const parsed = providerSearchSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the search" };
  }

  try {
    const { provider, mediaType, query } = parsed.data;
    const candidates = await searchProviderCatalog(provider, mediaType, query);
    return { candidates, query };
  } catch (error) {
    return fail(error, "The provider could not be searched");
  }
};

export const importTitleAction = async (
  prevState: ImportTitleState,
  input: ImportTitleInput,
): Promise<ImportTitleState> => {
  await requireAdmin();
  const parsed = importTitleSchema.safeParse(input);
  if (!parsed.success) {
    return { ...prevState, error: "That record could not be read" };
  }

  try {
    const { provider, mediaType, externalId } = parsed.data;
    const result = await importProviderTitle(provider, mediaType, externalId);
    revalidatePath("/catalog");
    revalidatePath("/");
    return {
      imported: {
        ...prevState.imported,
        [`${provider}:${externalId}`]: { uuid: result.uuid, slug: result.slug },
      },
    };
  } catch (error) {
    return { ...prevState, ...fail(error, "Could not import this title") };
  }
};

export const bulkImportAction = async (
  _prevState: BulkImportState,
  input: BulkImportInput,
): Promise<BulkImportState> => {
  await requireAdmin();
  const parsed = bulkImportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the import" };
  }

  try {
    const { provider, mediaType, list, pages } = parsed.data;
    const summary = await importProviderList(provider, mediaType, list, pages);
    revalidatePath("/catalog");
    revalidatePath("/");
    return { summary };
  } catch (error) {
    return fail(error, "The import could not run");
  }
};
