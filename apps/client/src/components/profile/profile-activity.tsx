import Link from "next/link";
import { getUserTimezone, listRecentActivity, PublicProfile } from "services";
import { DiaryLines } from "@/components/diary/diary-lines";
import { SectionHeading } from "@/components/shared/section-heading";

type ProfileActivityProps = {
  profile: PublicProfile;
};

/** The latest lines of the owner's diary. The owner gets a link to the whole of it. */
export const ProfileActivity = async ({ profile }: ProfileActivityProps) => {
  const [lines, timezone] = await Promise.all([
    listRecentActivity(profile.uuid),
    getUserTimezone(profile.uuid),
  ]);
  if (lines.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Recent activity"
        action={
          profile.relation === "owner" ? (
            <Link href="/diary" className="text-sm text-muted transition-colors hover:text-ink">
              Open your diary
            </Link>
          ) : undefined
        }
      />
      <div className="rounded-card border border-hairline bg-surface px-4">
        <DiaryLines lines={lines} timezone={timezone} showDate />
      </div>
    </section>
  );
};
