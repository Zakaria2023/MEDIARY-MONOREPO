import { Metadata } from "next";
import { getOwnProfile } from "services";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile settings",
};

/**
 * The profile form, filled from the owner's row. The layout above has
 * already gated the section; this read is the owner's own data, so the
 * user lookup here is a key, not a check.
 */
const ProfileSettingsPage = async () => {
  const user = await requireOnboardedUser();
  const profile = await getOwnProfile(user.uuid);

  return <ProfileForm profile={profile} />;
};

export default ProfileSettingsPage;
