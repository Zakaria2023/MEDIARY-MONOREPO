import { RequireMember } from "@/components/layout/require-member";
import { StatsScreen } from "@/components/stats/stats-screen";

/** The member's numbers across every medium: time, finishes, scores, and each medium's own line. */
const StatsRoute = () => (
  <RequireMember>
    <StatsScreen />
  </RequireMember>
);

export default StatsRoute;
