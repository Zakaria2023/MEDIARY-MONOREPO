import { Metadata } from "next";
import { getPrivacySettings, listSocialControls } from "services";
import { PrivacyForm } from "@/components/settings/privacy-form";
import { SocialControlsList } from "@/components/settings/social-controls-list";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Privacy settings",
};

const PrivacySettingsPage = async () => {
  const user = await requireOnboardedUser();
  const [settings, controls] = await Promise.all([getPrivacySettings(user.uuid), listSocialControls(user.uuid)]);

  return (
    <div className="flex flex-col gap-6">
      <PrivacyForm settings={settings} />
      <SocialControlsList initial={controls} />
    </div>
  );
};

export default PrivacySettingsPage;
