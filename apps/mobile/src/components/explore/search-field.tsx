import { Search, X } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
};

/** The one search box: every medium, every name a title goes by. */
export const SearchField = ({ value, onChange, onClear }: SearchFieldProps) => (
  <View style={styles.field}>
    <Search size={18} color={colors.muted} />
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search films, games, books, anime…"
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.accent}
      accessibilityLabel="Search the catalog"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      style={styles.input}
    />
    {value ? (
      <Pressable accessibilityRole="button" accessibilityLabel="Clear the search" onPress={onClear} hitSlop={10}>
        <X size={18} color={colors.muted} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: 48,
    paddingHorizontal: space[4],
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.surface,
  },
  input: {
    ...text.base,
    flex: 1,
    paddingVertical: space[3],
    fontFamily: fonts.body,
    color: colors.ink,
  },
});
