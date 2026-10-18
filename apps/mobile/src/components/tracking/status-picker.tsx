import { StyleSheet, View } from "react-native";
import { MediaType, TrackingStatus, trackingStatuses } from "@/db/enum";
import { TRACKING_STATUS_LABELS } from "@/db/label";
import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { space } from "@/lib/theme";

type StatusPickerProps = {
  mediaType: MediaType;
  value: TrackingStatus;
  onChange: (status: TrackingStatus) => void;
};

/** The five statuses in the medium's own words: "Playing", "Watchlist", "Want to Read". */
export const StatusPicker = ({ mediaType, value, onChange }: StatusPickerProps) => (
  <View style={styles.field}>
    <FieldLabel label="Status" />
    <View style={styles.row}>
      {trackingStatuses.map((status) => (
        <Chip
          key={status}
          label={TRACKING_STATUS_LABELS[mediaType][status]}
          selected={status === value}
          onPress={() => onChange(status)}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  field: {
    gap: space[2],
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
  },
});
