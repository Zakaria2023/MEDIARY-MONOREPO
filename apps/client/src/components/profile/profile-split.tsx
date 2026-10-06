import { getMediaSplit, PublicProfile } from "services";
import { MediaSplitBars } from "@/components/stats/media-split-bars";
import { SectionHeading } from "@/components/shared/section-heading";

type ProfileSplitProps = {
  profile: PublicProfile;
};

/** The share of each medium in the library, by time. Nothing tracked, nothing shown. */
export const ProfileSplit = async ({ profile }: ProfileSplitProps) => {
  const split = await getMediaSplit(profile.uuid);
  if (split.every((row) => row.minutes === 0)) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <SectionHeading title="Media split" description="Share of tracked time." />
      <MediaSplitBars split={split} />
    </section>
  );
};
