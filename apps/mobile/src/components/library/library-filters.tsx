import { ScrollView, StyleSheet, View } from "react-native";
import { MediaType, TrackingStatus } from "@/db/enum";
import { Chip } from "@/components/ui/chip";
import { space } from "@/lib/theme";

type FilterOption<T> = {
  value: T;
  label: string;
  count: number;
};

type LibraryFiltersProps = {
  mediaOptions: FilterOption<MediaType>[];
  statusOptions: FilterOption<TrackingStatus>[];
  mediaType: MediaType | undefined;
  status: TrackingStatus | undefined;
  onMediaType: (mediaType: MediaType) => void;
  onStatus: (status: TrackingStatus) => void;
};

/** The library's two rows of chips: which medium, then which status, each with its count. */
export const LibraryFilters = ({
  mediaOptions,
  statusOptions,
  mediaType,
  status,
  onMediaType,
  onStatus,
}: LibraryFiltersProps) => (
  <View style={styles.filters}>
    {mediaOptions.length > 1 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {mediaOptions.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            count={option.count}
            selected={option.value === mediaType}
            onPress={() => onMediaType(option.value)}
          />
        ))}
      </ScrollView>
    ) : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {statusOptions.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          count={option.count}
          selected={option.value === status}
          onPress={() => onStatus(option.value)}
        />
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  filters: {
    gap: space[2],
    paddingBottom: space[2],
  },
  row: {
    gap: space[2],
  },
});
