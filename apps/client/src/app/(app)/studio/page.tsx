import { ArrowRight, CircleSlash } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { getCreatorState, isFeatureOn } from "services";
import { AsyncSection } from "ui";
import { CREATOR_STATUS_LABELS } from "@/db/label";
import { CreatorBadge } from "@/components/creators/creator-badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { CreatorOverview } from "@/components/studio/creator-overview";
import { CreatorOverviewSkeleton } from "@/components/studio/creator-overview-skeleton";
import { CreatorPending } from "@/components/studio/creator-pending";
import { CreatorRequestForm } from "@/components/studio/creator-request-form";
import { CreatorSettingsForm } from "@/components/studio/creator-settings-form";
import { getCurrentUser } from "@/lib/auth";
import { profilePath } from "@/lib/profile-path";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Creator studio",
  description: "Your verified creator profile: its numbers, your badge and the brands that invited you.",
  path: "/studio",
  noIndex: true,
});

/**
 * THE CREATOR STUDIO, apart from the profile editor: a member asks to be
 * verified here, waits here, and once verified reads their numbers, answers
 * brands and sets their badge. Private; the (app) layout lets only members in.
 */
const StudioPage = async () => {
  // Gated by the (app) layout; the cached lookup, for the uuid.
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const state = isFeatureOn("creators") ? await getCreatorState(user.uuid) : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
      <SectionHeading
        size="page"
        title="Creator studio"
        description="For people who make videos, stream, write or review: a verified profile, its numbers, and brand campaigns you choose to take."
      />

      {!isFeatureOn("creators") && (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
          <CircleSlash size={26} className="text-faint" />
          <p className="text-base font-medium text-ink">Creator profiles are switched off for now</p>
          <p className="max-w-sm text-sm text-muted">Your profile, lists and followers are unchanged. Check back soon.</p>
        </div>
      )}

      {isFeatureOn("creators") && !state && <CreatorRequestForm previous={null} />}

      {state?.status === "pending" && <CreatorPending state={state} />}

      {(state?.status === "rejected" || state?.status === "revoked") && (
        <>
          <div className="flex flex-col gap-1 rounded-card border border-hairline bg-surface px-5 py-4">
            <p className="text-sm font-medium text-ink">{CREATOR_STATUS_LABELS[state.status]}</p>
            <p className="text-sm text-muted">
              {state.reviewNote ?? "Staff could not confirm the channels were yours."} You can ask again with a new code.
            </p>
          </div>
          <CreatorRequestForm previous={{ category: state.category }} />
        </>
      )}

      {state?.status === "verified" && user.username && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <CreatorBadge category={state.category} />
            <Link
              href={profilePath(user.username)}
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover"
            >
              See your profile
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <AsyncSection reloadKey={`studio-${user.uuid}`} skeleton={<CreatorOverviewSkeleton />}>
            <CreatorOverview userUuid={user.uuid} />
          </AsyncSection>
          <CreatorSettingsForm initial={{ category: state.category, discoverable: state.discoverable }} />
        </>
      )}
    </main>
  );
};

export default StudioPage;
