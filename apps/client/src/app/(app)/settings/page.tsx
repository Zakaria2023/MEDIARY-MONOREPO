import { redirect } from "next/navigation";

/** `/settings` is a folder, not a page; the first section is the page. */
const SettingsIndexPage = () => {
  redirect("/settings/profile");
};

export default SettingsIndexPage;
