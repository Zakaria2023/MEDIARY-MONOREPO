import { Metadata } from "next";
import { getPrivacySettings } from "services";
import { PrivacyForm } from "@/components/settings/privacy-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Privacy settings",
};

const PrivacySettingsPage = async () => {
  const user = await requireOnboardedUser();
  const settings = await getPrivacySettings(user.uuid);

  return <PrivacyForm settings={settings} />;
};

export default PrivacySettingsPage;
