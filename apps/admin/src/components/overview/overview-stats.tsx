import { Clapperboard, ShieldCheck, Users } from "lucide-react";
import { getAdminOverview } from "services";
import { StatTile } from "@/components/overview/stat-tile";

const FORMAT = new Intl.NumberFormat("en-US");

/**
 * The async part of the overview: three live counts. It is the child a
 * Suspense boundary wraps, so the heading paints before the queries answer.
 */
export const OverviewStats = async () => {
  const overview = await getAdminOverview();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
    </div>
  );
};
