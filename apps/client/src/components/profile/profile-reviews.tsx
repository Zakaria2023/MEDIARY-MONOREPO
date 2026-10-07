import Link from "next/link";
import { listUserReviews, PublicProfile } from "services";
import { Pagination } from "ui";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { ProfileReviewCard } from "@/components/profile/profile-review-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { profileReviewsPath } from "@/lib/profile-path";

type ProfileReviewsProps = {
  profile: PublicProfile;
  /** On the profile itself: a few, with the way to all. On the reviews page: a page of them. */
  page: number | null;
};

const PREVIEW = 3;

/** Someone's reviews the viewer may read: the latest few on the profile, every one on /@username/reviews. */
export const ProfileReviews = async ({ profile, page }: ProfileReviewsProps) => {
  const viewer = await getCurrentUser();
  const result = await listUserReviews(profile.uuid, viewer?.uuid ?? null, page === null ? { pageSize: PREVIEW } : { page });
  const canRespond = viewer !== null;

  if (page === null) {
    if (result.total === 0) {
      return null;
    }
    return (
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Reviews"
          action={
            result.total > PREVIEW ? (
              <Link href={profileReviewsPath(profile.username)} className="text-sm text-muted transition-colors hover:text-ink">
                All {result.total} reviews
              </Link>
            ) : undefined
          }
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {result.items.map((review) => (
            <ProfileReviewCard key={review.uuid} review={review} canRespond={canRespond && !review.isOwn} />
          ))}
        </div>
      </section>
    );
  }

  if (result.total === 0) {
    return (
      <CatalogEmptyState
        heading="No reviews yet"
        body={profile.relation === "owner" ? "Open any title you have finished and write the first." : `${profile.displayName} has not written any you can see.`}
        action={{ label: "Explore the catalog", href: "/explore" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-2">
        {result.items.map((review) => (
          <ProfileReviewCard key={review.uuid} review={review} canRespond={canRespond && !review.isOwn} />
        ))}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => profileReviewsPath(profile.username, target)} />
    </div>
  );
};
