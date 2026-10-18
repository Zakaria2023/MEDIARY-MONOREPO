import { StyleSheet, Text, View } from "react-native";
import { TrackingStatus } from "@/db/enum";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { colors, fonts, space, statusColors, text } from "@/lib/theme";

type StatusBreakdownProps = {
  statuses: { status: TrackingStatus; label: string; count: number; share: number }[];
};

/** How the library splits by status: a bar each, in the status's color, with its count. */
export const StatusBreakdown = ({ statuses }: StatusBreakdownProps) => (
  <View style={styles.section}>
    <SectionHeader title="By status" />
    {statuses.map((row) => (
      <View key={row.status} style={styles.row}>
        <View style={styles.labels}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.count}>{row.count}</Text>
        </View>
        <ProgressBar fraction={row.share} color={statusColors[row.status]} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  section: {
    gap: space[3],
  },
  row: {
    gap: space[2],
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
  count: {
    ...text.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
});
