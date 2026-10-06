import { Metadata } from "next";
import { listImports } from "services";
import { ImportHistory } from "@/components/settings/import-history";
import { ImportUploadForm } from "@/components/settings/import-upload-form";
import { requireOnboardedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Import your lists",
};

/**
 * Bringing a list in from elsewhere: the upload, then every earlier
 * import. The layout above has already gated the section.
 */
const ImportsSettingsPage = async () => {
  const user = await requireOnboardedUser();
  const imports = await listImports(user.uuid);

  return (
    <div className="flex flex-col gap-6">
      <ImportUploadForm />
      <ImportHistory imports={imports} />
    </div>
  );
};

export default ImportsSettingsPage;
