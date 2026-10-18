import { router } from "expo-router";
import { ChartColumn, CloudOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { LabelledRows } from "@/components/stats/labelled-rows";
import { StatusBreakdown } from "@/components/stats/status-breakdown";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTiles } from "@/components/ui/stat-tiles";
import { StateMessage } from "@/components/ui/state-message";
import { useStatsScreen } from "@/hooks/stats/use-stats-screen";
import { space } from "@/lib/theme";

/** The member's numbers across every medium: time, finishes, scores, and each medium's own line. */
export const StatsScreen = () => {
  const { stats, isEmpty, tiles, statuses, media, genres } = useStatsScreen();
  if (stats.isPending) {
    return (
      <Screen edges={["left", "right"]}>
        <View style={styles.skeleton}>
          {[0, 1, 2, 3].map((slot) => (
            <Skeleton key={slot} width="47%" height={76} shape="card" />
          ))}
        </View>
      </Screen>
    );
  }
  if (stats.isError) {
    return (
      <Screen edges={["left", "right"]}>
        <StateMessage
          icon={CloudOff}
          title="Your stats did not load"
          body={stats.error.message}
          actionLabel="Try again"
          onAction={() => void stats.refetch()}
        />
      </Screen>
    );
  }
  if (isEmpty) {
    return (
      <Screen edges={["left", "right"]}>
        <StateMessage
          icon={ChartColumn}
          title="No numbers yet"
          body="Track a few titles and this fills in: time spent, what you finish, how you score."
          actionLabel="Find something to track"
          onAction={() => router.push("/explore")}
        />
      </Screen>
    );
  }
  return (
    <Screen scroll edges={["left", "right"]} onRefresh={() => void stats.refetch()} refreshing={stats.isRefetching}>
      <View style={styles.top}>
        <StatTiles tiles={tiles} />
      </View>
      <StatusBreakdown statuses={statuses} />
      <LabelledRows title="By medium" rows={media} />
      <LabelledRows title="Top genres" rows={genres} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  top: {
    paddingTop: space[4],
  },
  skeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
    paddingTop: space[4],
  },
});
