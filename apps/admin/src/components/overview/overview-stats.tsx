import { BadgeCheck, Clapperboard, Megaphone, ShieldCheck, Users } from "lucide-react";
import { countLiveCampaigns, countPendingCreators, getAdminOverview } from "services";
import { StatTile } from "@/components/overview/stat-tile";

const FORMAT = new Intl.NumberFormat("en-US");

/**
 * The async part of the overview: live counts, with the creator requests
 * waiting for staff and the sponsorships running now. It is the child a
 * Suspense boundary wraps, so the heading paints before the queries answer.
 */
export const OverviewStats = async () => {
  const [overview, pendingCreators, liveCampaigns] = await Promise.all([getAdminOverview(), countPendingCreators(), countLiveCampaigns()]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatTile
        label="Members"
        value={FORMAT.format(overview.members)}
        detail="Everyone with an account"
        icon={<Users size={16} />}
      />
      <StatTile
        label="Staff"
        value={FORMAT.format(overview.staff)}
        detail="Admins and moderators"
        icon={<ShieldCheck size={16} />}
      />
      <StatTile
        label="Titles"
        value={FORMAT.format(overview.titles)}
        detail={
          overview.titles === 0
            ? "The catalog fills with the first import"
            : "Across every medium"
        }
        icon={<Clapperboard size={16} />}
      />
      <StatTile
        label="Creator requests"
        value={FORMAT.format(pendingCreators)}
        detail={pendingCreators === 0 ? "None waiting" : "Waiting on the creators screen"}
        icon={<BadgeCheck size={16} />}
      />
      <StatTile
        label="Live campaigns"
        value={FORMAT.format(liveCampaigns)}
        detail="Sponsored titles showing now"
        icon={<Megaphone size={16} />}
      />
    </div>
  );
};
