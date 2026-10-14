import { BadgeCheck } from "lucide-react";
import { Badge } from "ui";
import { CreatorCategory } from "@/db/enum";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";

type CreatorBadgeProps = {
  category: CreatorCategory;
};

/**
 * THE VERIFIED CREATOR MARK: staff checked that the channels are this
 * member's. It says who someone is, never that they paid; verification is
 * not for sale.
 */
export const CreatorBadge = ({ category }: CreatorBadgeProps) => (
  <Badge tone="accent" icon={<BadgeCheck size={13} aria-hidden />}>
    <span className="sr-only">Verified </span>
    {CREATOR_CATEGORY_LABELS[category]}
  </Badge>
);
