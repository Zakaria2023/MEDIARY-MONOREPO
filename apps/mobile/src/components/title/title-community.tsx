import { StyleSheet, Text, View } from "react-native";
import { formatCount } from "utils";
import { MediaType, trackingStatuses } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { SectionHeader } from "@/components/ui/section-header";
import { TitleCommunity as Community } from "@/lib/api-types";
import { colors, fonts, radius, space, statusColors, text } from "@/lib/theme";

type TitleCommunityProps = {
  mediaType: MediaType;
  community: Community | undefined;
};

/**
 * What Mediary's members do with the title, in the medium's own words:
 * "12 Watching · 40 Watched". Counts only, never who. Says so plainly when
 * nobody holds it yet, which is an invitation rather than a gap.
 */
export const TitleCommunity = ({ mediaType, community }: TitleCommunityProps) => {
  if (!community) {
    return null;
  }
  const held = trackingStatuses.filter((status) => community.statuses[status] > 0);
  return (
    <View style={styles.section}>
      <SectionHeader title="On Mediary" />
      {community.members === 0 ? (
        <Text style={styles.empty}>Nobody has tracked this yet. Be the first.</Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.total}>
            {formatCount(community.members)} {community.members === 1 ? "member" : "members"}
          </Text>
          <View style={styles.statuses}>
            {held.map((status) => (
              <View key={status} style={styles.status}>
                <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
                <Text style={styles.label}>
                  {formatCount(community.statuses[status])} {TRACKING_STATUS_LABELS[mediaType][status]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
  list: {
    gap: space[2],
  },
  total: {
    ...text.base,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  statuses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.chip,
  },
  label: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
  empty: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});
