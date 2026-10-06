import { z } from "zod";
import { importSources } from "../../../db/enum";

export type ImportUploadInput = z.infer<typeof importUploadSchema>;
export type ApplyImportInput = z.infer<typeof applyImportSchema>;

/** The largest file the import form takes: a lifetime of lists fits in far less. */
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

/** The import form's fields beside the file itself. */
export const importUploadSchema = z.object({
  source: z.enum(importSources),
  fileName: z.string().trim().min(1, "Choose a file").max(255),
});

/** A previewed import to apply. */
export const applyImportSchema = z.object({
  importUuid: z.uuid(),
});
