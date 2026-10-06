"use client";

import { FileUp } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { Button, Dropdown, FormError } from "ui";
import { ImportSource, importSources } from "@/db/enum";
import { IMPORT_SOURCE_LABELS } from "@/db/label";
import { useImportUpload } from "@/app/(app)/settings/imports/use-import-upload";

/** Where each file comes from, in the person's own account elsewhere. */
const SOURCE_HELP: Record<ImportSource, string> = {
  mal: "On your list there, open the export page and download the XML. Every anime comes across with its status, score, episodes and dates.",
  letterboxd: "From your account's export, use watched.csv, ratings.csv, diary.csv or watchlist.csv. Films come across as watched, with ratings out of five put on Mediary's ten.",
  csv: "A spreadsheet saved as CSV with the columns title, type, and any of year, status, score, progress, started, finished. The type is anime, game, movie or tv.",
};

const ACCEPT: Record<ImportSource, string> = {
  mal: ".xml,text/xml,application/xml",
  letterboxd: ".csv,text/csv",
  csv: ".csv,text/csv",
};

/** The upload: pick where the file is from, pick the file, preview it. */
export const ImportUploadForm = () => {
  const {
    form: { control, register, formState },
    state,
    isPending,
    onSubmit,
  } = useImportUpload();
  const source = useWatch({ control, name: "source" });

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Bring a list in</h2>
        <p className="text-sm text-muted">
          Nothing changes until you have seen what was found. Titles already in your library are left as they are.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">The file is from</span>
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={field.onChange}
                options={importSources.map((value) => ({ value, label: IMPORT_SOURCE_LABELS[value] }))}
              />
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="import-file" className="text-sm font-medium text-ink">
            File
          </label>
          <input
            id="import-file"
            type="file"
            accept={ACCEPT[source]}
            className="block w-full cursor-pointer rounded-control border border-hairline-strong bg-surface text-sm text-secondary file:me-3 file:h-10 file:cursor-pointer file:border-0 file:border-e file:border-hairline file:bg-surface-2 file:px-3 file:text-sm file:font-medium file:text-ink"
            {...register("file")}
          />
          {formState.errors.file?.message && (
            <p className="text-xs text-danger">{String(formState.errors.file.message)}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted">{SOURCE_HELP[source]}</p>
      <FormError message={state.error} />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <FileUp size={16} />
          {isPending ? "Reading the file" : "Preview import"}
        </Button>
      </div>
    </form>
  );
};
