import { Clock, Flame, Heart, Trophy } from "lucide-react";
import { StatTile } from "@/components/shared/stat-tile";

/** The four numbers the home page opens with. */
export const WeeklySnapshot = () => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <StatTile
      label="This week"
      value="14h"
      detail="6h games, 8h watching"
      icon={<Clock size={15} />}
    />
    <StatTile
      label="Completed"
      value="3"
      detail="1 anime, 2 movies"
      icon={<Trophy size={15} />}
    />
    <StatTile
      label="Streak"
      value="12 days"
      detail="Logged something every day"
      icon={<Flame size={15} />}
    />
    <StatTile
      label="New favorite"
      value="Frieren"
      detail="Added Tuesday"
      icon={<Heart size={15} />}
    />
  </div>
);
