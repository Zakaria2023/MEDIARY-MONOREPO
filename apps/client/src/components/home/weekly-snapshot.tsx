import { Clock, Flame, Heart, Trophy } from "lucide-react";
import { getWeeklySnapshot } from "services";
import { formatCount, formatTrackedTime } from "utils";
import { StatTile } from "@/components/shared/stat-tile";

type WeeklySnapshotProps = {
  userUuid: string;
};

/**
 * THE WEEK IN FOUR NUMBERS, under the greeting: time logged, what was
 * finished, what was hearted, and the streak. A week with nothing in it
 * is not shown; the rails below are the invitation.
 */
export const WeeklySnapshot = async ({ userUuid }: WeeklySnapshotProps) => {
  const week = await getWeeklySnapshot(userUuid);
  if (week.moments === 0 && week.favorites === 0 && week.streak === 0) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 sm:px-8">
      <h2 className="text-xs font-medium uppercase tracking-wide text-faint">This week</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Time logged"
          value={week.minutes > 0 ? formatTrackedTime(week.minutes) : "—"}
          detail={`${formatCount(week.moments)} ${week.moments === 1 ? "moment" : "moments"} logged`}
          icon={<Clock size={15} />}
        />
        <StatTile
          label="Finished"
          value={formatCount(week.completions)}
          detail={week.completions === 0 ? "Nothing finished yet this week" : "In the last seven days"}
          icon={<Trophy size={15} />}
        />
        <StatTile
          label="New favorites"
          value={formatCount(week.favorites)}
          detail={week.favorites === 0 ? "Heart a title in its sheet" : "Hearted this week"}
          icon={<Heart size={15} />}
        />
        <StatTile
          label="Streak"
          value={week.streak === 0 ? "—" : `${formatCount(week.streak)} ${week.streak === 1 ? "day" : "days"}`}
          detail={week.streak === 0 ? "Log something today to start one" : "Days in a row with something logged"}
          icon={<Flame size={15} />}
        />
      </div>
    </section>
  );
};
