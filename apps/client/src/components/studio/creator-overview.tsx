import { Eye, Handshake, Link2, ListChecks, Sparkles, Users } from "lucide-react";
import { getCreatorDashboard, listOwnLists } from "services";
import { formatCount } from "utils";
import { StatTile } from "@/components/shared/stat-tile";
import { CreatorCampaignCard } from "@/components/studio/creator-campaign-card";
import { CreatorDayBars } from "@/components/studio/creator-day-bars";

type CreatorOverviewProps = {
  userUuid: string;
};

/**
 * A VERIFIED CREATOR'S NUMBERS: thirty days of profile, list and comparison
 * opens and link presses, their audience, and the brands that invited them.
 * Every number is a count; nothing here says who looked.
 */
export const CreatorOverview = async ({ userUuid }: CreatorOverviewProps) => {
  const [dashboard, lists] = await Promise.all([getCreatorDashboard(userUuid), listOwnLists(userUuid)]);
  const publicLists = lists.filter((list) => list.visibility === "public").map(({ uuid, name }) => ({ uuid, name }));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Profile views" value={formatCount(dashboard.totals.profileViews)} detail={`Last ${dashboard.days} days`} icon={<Eye size={16} />} />
        <StatTile label="List views" value={formatCount(dashboard.totals.listViews)} detail={`Across ${formatCount(dashboard.lists)} lists`} icon={<ListChecks size={16} />} />
        <StatTile label="Taste matches" value={formatCount(dashboard.totals.compareViews)} detail="People comparing with you" icon={<Sparkles size={16} />} />
        <StatTile label="Link presses" value={formatCount(dashboard.totals.linkClicks)} detail="On your profile's links" icon={<Link2 size={16} />} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <CreatorDayBars days={dashboard.byDay} span={dashboard.days} />
        <StatTile
          label="Followers"
          value={formatCount(dashboard.followers)}
          detail={`${formatCount(dashboard.newFollowers)} new in ${dashboard.days} days · ${formatCount(dashboard.reviews)} reviews written`}
          icon={<Users size={16} />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg text-ink">Brand campaigns</h2>
          <p className="text-sm text-muted">
            Invitations from brands, through Mediary. Taking one is your choice, and the list you name says it is paid.
          </p>
        </div>
        {dashboard.campaigns.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-hairline-strong px-6 py-10 text-center">
            <Handshake size={24} className="text-faint" />
            <p className="text-sm text-muted">No invitations yet. When a brand asks for you, it shows here.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {dashboard.campaigns.map((invitation) => (
              <CreatorCampaignCard key={invitation.uuid} invitation={invitation} lists={publicLists} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
