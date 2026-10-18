import { ScrollView, StyleSheet } from "react-native";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { Chip } from "@/components/ui/chip";
import { space } from "@/lib/theme";

type MediumFilterProps = {
  selected: LaunchMediaType | undefined;
  counts: Partial<Record<LaunchMediaType, number>>;
  onSelect: (mediaType: LaunchMediaType) => void;
};

/** The media a search found something in, each with its count; pressing one again shows all. */
export const MediumFilter = ({ selected, counts, onSelect }: MediumFilterProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {launchMediaTypes
      .filter((mediaType) => (counts[mediaType] ?? 0) > 0 || mediaType === selected)
      .map((mediaType) => (
        <Chip
          key={mediaType}
          label={MEDIA_TYPE_PLURAL_LABELS[mediaType]}
          count={counts[mediaType] ?? 0}
          selected={mediaType === selected}
          onPress={() => onSelect(mediaType)}
        />
      ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: {
    gap: space[2],
  },
});
