import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "@/components/ui/section-header";
import { colors, fonts, space, text } from "@/lib/theme";

type LabelledRowsProps = {
  title: string;
  rows: { key: string; label: string; detail: string }[];
};

/** A heading and a list of lines, each a name with its numbers under it. Nothing when there are no lines. */
export const LabelledRows = ({ title, rows }: LabelledRowsProps) =>
  rows.length === 0 ? null : (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <View style={styles.list}>
        {rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.detail}>{row.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );

const styles = StyleSheet.create({
  section: {
    gap: space[3],
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  row: {
    gap: 2,
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  label: {
    ...text.base,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  detail: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});
