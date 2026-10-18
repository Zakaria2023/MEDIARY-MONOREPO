import { Minus, Plus } from "lucide-react-native";
import { Control, useController } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { UpsertEntryInput } from "validators";
import { ProgressUnit } from "@/db/enum";
import { PROGRESS_UNIT_LABELS } from "@/db/label";
import { FieldLabel } from "@/components/ui/field-label";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type ProgressFieldProps = {
  control: Control<UpsertEntryInput>;
  unit: ProgressUnit;
  /** What the progress reads against: the total, or a game's hours to finish. */
  goal: number | null;
  /** The most it may be now; the stepper stops there. */
  cap: number | null;
  /** Completed with a total: the status says how far, not the field. */
  locked: boolean;
};

/** How far along: a number with a step down and a step up, in the entry's own unit. */
export const ProgressField = ({ control, unit, goal, cap, locked }: ProgressFieldProps) => {
  const { field, fieldState } = useController({ control, name: "progressValue" });
  const value = Number(field.value) || 0;
  const unitLabel = PROGRESS_UNIT_LABELS[unit];
  const step = (delta: number) => {
    const next = Math.max(0, value + delta);
    field.onChange(cap === null ? next : Math.min(cap, next));
  };
  return (
    <View style={styles.field}>
      <FieldLabel label="Progress" />
      <View style={[styles.row, locked && styles.locked]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`One ${unitLabel} less`}
          disabled={locked || value <= 0}
          onPress={() => step(-1)}
          style={styles.step}
        >
          <Minus size={18} color={colors.ink} />
        </Pressable>
        <TextInput
          accessibilityLabel={`Progress in ${unitLabel}`}
          editable={!locked}
          keyboardType="decimal-pad"
          value={String(value)}
          onChangeText={(typed) => field.onChange(Number(typed.replace(",", ".")) || 0)}
          onBlur={field.onBlur}
          selectionColor={colors.accent}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`One ${unitLabel} more`}
          disabled={locked || (cap !== null && value >= cap)}
          onPress={() => step(1)}
          style={styles.step}
        >
          <Plus size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.of}>{goal === null ? unitLabel : `of ${goal} ${unit === "percent" ? "" : unitLabel}`.trim()}</Text>
      </View>
      {fieldState.error ? <Text style={styles.error}>{fieldState.error.message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: space[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  locked: {
    opacity: 0.6,
  },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  input: {
    ...text.lg,
    minWidth: 72,
    height: 44,
    textAlign: "center",
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  of: {
    ...text.sm,
    flexShrink: 1,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  error: {
    ...text.xs,
    fontFamily: fonts.body,
    color: colors.danger,
  },
});
