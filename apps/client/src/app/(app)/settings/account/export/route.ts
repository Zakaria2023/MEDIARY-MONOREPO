import { exportFile, ExportKind } from "services";
import { requireOnboardedUser } from "@/lib/auth";

const KINDS: readonly ExportKind[] = ["library", "diary"];

/**
 * A FILE TO KEEP: the library or the diary as CSV. A download is the one
 * thing a Server Action cannot hand back, which is why this is a Route
 * Handler; it checks the caller itself and calls one service function.
 */
export const GET = async (request: Request) => {
  const user = await requireOnboardedUser();
  const kind = new URL(request.url).searchParams.get("kind");
  const wanted = KINDS.find((candidate) => candidate === kind);
  if (!wanted) {
    return Response.json({ error: "Choose the library or the diary" }, { status: 400 });
  }
  const file = await exportFile(user.uuid, wanted);
  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
};
