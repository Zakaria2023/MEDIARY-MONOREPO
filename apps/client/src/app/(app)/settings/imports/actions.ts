"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyImport, LibraryImport, previewImport, PRODUCT_EVENTS, track } from "services";
import { ActionResult, fail } from "utils";
import {
  applyImportSchema,
  ApplyImportInput,
  importUploadSchema,
  MAX_IMPORT_FILE_BYTES,
} from "validators";
import { requireOnboardedUser } from "@/lib/auth";
import { overActionLimit } from "@/lib/server/action-limit";

export type ApplyImportResult = ActionResult & {
  summary?: LibraryImport;
};

/**
 * The upload. A file has to arrive as FormData, so this is the one action
 * that reads one rather than a validated object; the fields beside the
 * file still go through the schema. A readable file becomes a preview and
 * the person is sent to it.
 */
export const previewImportAction = async (
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> => {
  const user = await requireOnboardedUser();
  const limited = await overActionLimit(user.uuid, "import");
  if (limited) {
    return { error: limited };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to import" };
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { error: "That file is larger than 5 MB" };
  }
  const parsed = importUploadSchema.safeParse({ source: formData.get("source"), fileName: file.name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  let importUuid: string;
  try {
    const text = await file.text();
    const preview = await previewImport(user.uuid, parsed.data.source, parsed.data.fileName, text);
    track(PRODUCT_EVENTS.importStarted, { source: preview.source, lines: preview.itemCount, matched: preview.matchedCount });
    importUuid = preview.uuid;
  } catch (error) {
    return fail(error, "Could not read that file");
  }

  revalidatePath("/settings/imports", "layout");
  redirect(`/settings/imports/${importUuid}`);
};

/** The preview's "Import" button. */
export const applyImportAction = async (
  _prevState: ApplyImportResult,
  input: ApplyImportInput,
): Promise<ApplyImportResult> => {
  const user = await requireOnboardedUser();
  const parsed = applyImportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That import could not be found" };
  }

  try {
    const summary = await applyImport(user.uuid, parsed.data.importUuid);
    track(PRODUCT_EVENTS.importCompleted, { source: summary.source, created: summary.createdCount, skipped: summary.skippedCount });
    revalidatePath("/library", "layout");
    revalidatePath("/settings/imports", "layout");
    revalidatePath("/");
    return { success: true, summary };
  } catch (error) {
    return fail(error, "Could not import this file");
  }
};
