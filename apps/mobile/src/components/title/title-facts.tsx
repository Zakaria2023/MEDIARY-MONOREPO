import { StyleSheet, Text, View } from "react-native";
import { SectionHeader } from "@/components/ui/section-header";
import { CatalogFact } from "@/lib/api-types";
import { colors, fonts, space, text } from "@/lib/theme";

type TitleFactsProps = {
  facts: CatalogFact[];
};

/** The facts the site lists, in its words, each a label and a value; an unknown one is left out. */
export const TitleFacts = ({ facts }: TitleFactsProps) => {
  const known = facts.filter((fact) => fact.value);
  if (known.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <SectionHeader title="Details" />
      <View style={styles.list}>
        {known.map((fact) => (
          <View key={fact.label} style={styles.row}>
            <Text style={styles.label}>{fact.label}</Text>
            <Text style={styles.value}>{fact.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  row: {
    flexDirection: "row",
    gap: space[4],
    paddingVertical: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  label: {
    ...text.sm,
    width: 110,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  value: {
    ...text.sm,
    flex: 1,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
});
