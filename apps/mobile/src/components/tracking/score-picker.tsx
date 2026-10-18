import { Control, useController } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import { UpsertEntryInput } from "validators";
import { Chip } from "@/components/ui/chip";
import { FieldLabel } from "@/components/ui/field-label";
import { space } from "@/lib/theme";

type ScorePickerProps = {
  control: Control<UpsertEntryInput>;
};

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** A score out of ten, or none: "not rated" is a state of its own. */
export const ScorePicker = ({ control }: ScorePickerProps) => {
  const { field } = useController({ control, name: "score" });
  const chosen = field.value === null ? null : Math.round(field.value);
  return (
    <View style={styles.field}>
      <FieldLabel label="Score" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="None" selected={chosen === null} onPress={() => field.onChange(null)} />
        {SCORES.map((score) => (
          <Chip key={score} label={String(score)} selected={chosen === score} onPress={() => field.onChange(score)} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: space[2],
  },
  row: {
    gap: space[2],
  },
});
