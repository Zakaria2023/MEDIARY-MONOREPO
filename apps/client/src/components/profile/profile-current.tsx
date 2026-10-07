import Link from "next/link";
import { listContinueEntries, PublicProfile } from "services";
import { Poster } from "ui";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { formatProgress, progressCapFor } from "@/lib/format-progress";
import { titlePath } from "@/lib/title-path";

type ProfileCurrentProps = {
  profile: PublicProfile;
};

/** What the owner is in the middle of, as read-only cards; the owner's own home has the live ones. */
export const ProfileCurrent = async ({ profile }: ProfileCurrentProps) => {
  const items = await listContinueEntries(profile.uuid, 8);
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Currently"
        description={profile.relation === "owner" ? "What you are in the middle of." : "What they are in the middle of."}
      />
      <div className="scrollbar-none -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8">
        {items.map(({ title, entry }) => {
          const total = progressCapFor(title, entry.progressUnit);
          return (
            <article
              key={entry.uuid}
              className="relative flex w-64 shrink-0 snap-start gap-3 rounded-card border border-hairline bg-surface p-3 transition-colors hover:border-hairline-strong"
            >
              <Link
                href={titlePath(title)}
                aria-label={`Open ${title.canonicalTitle}`}
                className="absolute inset-0 z-10 rounded-card"
              />
              <div className="w-16 shrink-0">
                <Poster src={title.coverUrl} alt="" sizes="64px" dominantColor={title.dominantColor} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink">
                    {title.canonicalTitle}
                  </h3>
                  <p className="text-xs text-muted">
                    {MEDIA_TYPE_LABELS[title.mediaType]} · {formatProgress(entry.progressValue, entry.progressUnit, total)}
                  </p>
                </div>
                <ProgressBar value={entry.progressValue} total={total} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
