import { isFeatureOn } from "services";
import { LaunchMediaType } from "@/db/enum";
import { getCurrentUser } from "@/lib/auth";
import { LookFurther } from "@/components/search/look-further";
import { LookFurtherInvite } from "@/components/search/look-further-invite";

type LookFurtherSectionProps = {
  query: string;
  mediaType: LaunchMediaType | undefined;
};

/** Looking further for a member, the invitation to sign in for a visitor, nothing when it is switched off. */
export const LookFurtherSection = async ({ query, mediaType }: LookFurtherSectionProps) => {
  if (!isFeatureOn("look_further")) {
    return null;
  }
  const user = await getCurrentUser();
  return user?.username ? <LookFurther query={query} mediaType={mediaType} /> : <LookFurtherInvite />;
};
