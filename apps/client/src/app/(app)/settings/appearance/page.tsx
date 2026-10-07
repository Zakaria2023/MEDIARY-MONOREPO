import { Metadata } from "next";
import { getThemePrefs } from "services";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Appearance settings",
};

/** The appearance form, filled from the owner's profile row. */
const AppearanceSettingsPage = async () => {
  const user = await requireOnboardedUser();
  const prefs = await getThemePrefs(user.uuid);

  return <AppearanceForm initial={{ theme: prefs.theme, reducedMotion: prefs.reducedMotion }} />;
};

export default AppearanceSettingsPage;
