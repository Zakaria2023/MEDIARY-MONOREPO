import { Milestone } from "services";
import { formatCount } from "utils";
import { MediaType } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

/** A milestone as a chip reads: "100 completed", "500 hours", "10 anime finished". */
export const milestoneLabel = (milestone: Milestone): string => {
  const amount = formatCount(milestone.threshold);
  if (milestone.measure === "completed") {
    return `${amount} completed`;
  }
  if (milestone.measure === "hours") {
    return `${amount} hours`;
  }
  if (milestone.measure === "reviews") {
    return `${amount} ${milestone.threshold === 1 ? "review" : "reviews"}`;
  }
  if (milestone.measure === "lists") {
    return `${amount} ${milestone.threshold === 1 ? "list" : "lists"}`;
  }
  const mediaType = milestone.measure.slice("completed:".length) as MediaType;
  return `${amount} ${MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase()} finished`;
};
