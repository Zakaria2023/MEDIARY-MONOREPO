import { Disc3 } from "lucide-react";
import { ArtistRecord } from "services";
import { RecordCard } from "@/components/music/record-card";
import { RELEASE_TYPE_PLURAL_LABELS } from "@/db/label";
import { groupRecordsByType } from "@/lib/group-records";

type ArtistRecordsProps = {
  name: string;
  records: ArtistRecord[];
};

/** Two across on a phone, six on a wide desktop: square sleeves. */
const RECORD_GRID = "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6";
const RECORD_SIZES = "(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw";

/**
 * Everything an artist made that Mediary holds, a section per kind of
 * record (albums, then EPs, singles and the rest), newest first in each.
 * Each record opens its own page, with its songs.
 */
export const ArtistRecords = ({ name, records }: ArtistRecordsProps) => {
  const groups = groupRecordsByType(records);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <Disc3 size={28} className="text-faint" />
        <p className="text-base font-medium text-ink">No records of {name} yet</p>
        <p className="max-w-sm text-sm text-muted">Their albums appear here as soon as Mediary brings them in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {groups.map((group) => (
        <section key={group.releaseType} className="flex flex-col gap-5">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {RELEASE_TYPE_PLURAL_LABELS[group.releaseType]}
            </h2>
            <span className="tabular text-sm text-faint">{group.records.length}</span>
          </div>
          <div className={RECORD_GRID}>
            {group.records.map((record, index) => (
              <RecordCard key={record.uuid} record={record} sizes={RECORD_SIZES} priority={index < 6} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
