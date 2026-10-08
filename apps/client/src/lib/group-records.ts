import { ArtistRecord } from "services";
import { ReleaseType, releaseTypes } from "@/db/enum";

/** One kind of record on an artist's page and the records of that kind. */
export type RecordGroup = {
  releaseType: ReleaseType;
  records: ArtistRecord[];
};

/** An artist's records by kind, albums first and in the enum's order, each kind keeping its order; empty kinds left out. */
export const groupRecordsByType = (records: ArtistRecord[]): RecordGroup[] =>
  releaseTypes
    .map((releaseType) => ({ releaseType, records: records.filter((record) => record.releaseType === releaseType) }))
    .filter((group) => group.records.length > 0);
