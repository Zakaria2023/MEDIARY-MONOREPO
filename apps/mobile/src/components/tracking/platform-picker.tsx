import { Control, useController } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { UpsertEntryInput } from "validators";
import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { TrackingTarget } from "@/lib/api-types";
import { space } from "@/lib/theme";

type PlatformPickerProps = {
  control: Control<UpsertEntryInput>;
  platforms: TrackingTarget["platforms"];
};

/** Where a game is being played, from the platforms it is on. Nothing for a game with none. */
export const PlatformPicker = ({ control, platforms }: PlatformPickerProps) => {
  const { field } = useController({ control, name: "platformId" });
  if (platforms.length === 0) {
    return null;
  }
  return (
    <View style={styles.field}>
      <FieldLabel label="Playing on" />
      <View style={styles.row}>
        {platforms.map((platform) => (
          <Chip
            key={platform.id}
            label={platform.name}
            selected={field.value === platform.id}
            onPress={() => field.onChange(field.value === platform.id ? null : platform.id)}
          />
        ))}
      </View>
    </View>
  );
};

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
