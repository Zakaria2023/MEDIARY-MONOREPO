import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getImport } from "services";
import { isUuid } from "validators";
import { ImportLines } from "@/components/settings/import-lines";
import { ImportPreview } from "@/components/settings/import-preview";
import { requireOnboardedUser } from "@/lib/auth";

type Props = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Import preview",
};

/** One import: the preview and its button, or the result, and every line. */
const ImportDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const user = await requireOnboardedUser();
  const record = isUuid(uuid) ? await getImport(user.uuid, uuid) : null;
  if (!record) {
    notFound();
  }
  const { items, ...summary } = record;

  return (
    <div className="flex flex-col gap-8">
      <ImportPreview initial={summary} />
      <ImportLines items={items} />
    </div>
  );
};

export default ImportDetailPage;
