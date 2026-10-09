"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "ui";
import { useMoreRecords } from "@/app/(site)/artists/[slug]/use-more-records";

type MoreRecordsProps = {
  artistUuid: string;
  name: string;
};

/**
 * Under a member's view of a discography: Mediary holds an artist's best
 * known records first, so a missing album is one press away, ten at a time.
 */
export const MoreRecords = ({ artistUuid, name }: MoreRecordsProps) => {
  const { onBring, isPending, done, outcome, error } = useMoreRecords(artistUuid);

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface p-5 sm:p-6">
      <div className="flex max-w-xl flex-col gap-1">
        <h2 className="font-display text-lg font-semibold text-ink">Missing an album?</h2>
        <p aria-live="polite" className="text-sm text-muted">
          {error ? (
            <span role="alert" className="text-danger">
              {error}
            </span>
          ) : (
            (outcome ?? `Mediary can bring in more of ${name}’s albums and EPs from the music catalog, ten at a time.`)
          )}
        </p>
      </div>
      {!done && (
        <Button variant="outline" onClick={onBring} disabled={isPending} className="shrink-0">
          {isPending ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
          {isPending ? "Bringing in their records" : "Bring in more records"}
        </Button>
      )}
    </section>
  );
};
