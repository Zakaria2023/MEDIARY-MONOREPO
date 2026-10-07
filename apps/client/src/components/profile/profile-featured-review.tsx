import { getFeaturedReview, PublicProfile } from "services";
import { ProfileReviewCard } from "@/components/profile/profile-review-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { getCurrentUser } from "@/lib/auth";

type ProfileFeaturedReviewProps = {
  profile: PublicProfile;
};

/** The one review the owner pinned to their profile, when the viewer may read it. */
export const ProfileFeaturedReview = async ({ profile }: ProfileFeaturedReviewProps) => {
  const viewer = await getCurrentUser();
  const review = await getFeaturedReview(profile.uuid, viewer?.uuid ?? null);
  if (!review) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading title="Featured review" description={profile.relation === "owner" ? "The one you chose to lead with." : `The one ${profile.displayName} leads with.`} />
      <ProfileReviewCard review={review} canRespond={viewer !== null && !review.isOwn} />
    </section>
  );
};
