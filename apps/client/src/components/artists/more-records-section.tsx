import { isFeatureOn } from "services";
import { getCurrentUser } from "@/lib/auth";
import { MoreRecords } from "@/components/artists/more-records";

type MoreRecordsSectionProps = {
  artistUuid: string;
  name: string;
};

/** The press for more records, for a member only and only while looking further is on. */
export const MoreRecordsSection = async ({ artistUuid, name }: MoreRecordsSectionProps) => {
  if (!isFeatureOn("look_further")) {
    return null;
  }
  const user = await getCurrentUser();
  return user?.username ? <MoreRecords artistUuid={artistUuid} name={name} /> : null;
};
