import { getMilestones, getProfileCounts } from "services";
import { formatCount } from "utils";
import { getCurrentUser } from "@/lib/auth";
import { milestoneLabel } from "@/lib/milestone-copy";
import { milestoneCard } from "@/lib/server/share-card";

/**
 * A MILESTONE CARD AS A FILE: one the person has reached, named by its
 * measure and threshold. Checked here, as every image endpoint is; a
 * milestone not reached is not drawn.
 */
export const GET = async (request: Request): Promise<Response> => {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return new Response("Sign in to see this", { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const measure = params.get("measure");
  const threshold = Number(params.get("threshold"));
  const milestones = await getMilestones(viewer.uuid);
  const reached = milestones.reached.find((item) => item.measure === measure && item.threshold === threshold);
  if (!reached) {
    return new Response("Not reached", { status: 404 });
  }
  const counts = await getProfileCounts(viewer.uuid);

  return milestoneCard({
    name: viewer.displayName,
    label: milestoneLabel(reached),
    value: formatCount(reached.threshold),
    stats: [
      { label: "Titles", value: formatCount(counts.titles) },
      { label: "Completed", value: formatCount(counts.completed) },
      { label: "Hours", value: formatCount(counts.hours) },
    ],
  });
};
