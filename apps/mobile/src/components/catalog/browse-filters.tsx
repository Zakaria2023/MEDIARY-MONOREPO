import { ScrollView, StyleSheet, View } from "react-native";
import { Chip } from "@/components/ui/chip";
import { CatalogSortParam } from "@/lib/api";
import { CatalogGenreCount } from "@/lib/api-types";
import { space } from "@/lib/theme";

type BrowseFiltersProps = {
  sorts: { value: CatalogSortParam; label: string }[];
  sort: CatalogSortParam;
  genres: CatalogGenreCount[];
  genre: string | undefined;
  onSort: (sort: CatalogSortParam) => void;
  onGenre: (slug: string) => void;
};

/** A grid's two filters: the order, and one genre at a time. */
export const BrowseFilters = ({ sorts, sort, genres, genre, onSort, onGenre }: BrowseFiltersProps) => (
  <View style={styles.filters}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {sorts.map((option) => (
        <Chip key={option.value} label={option.label} selected={option.value === sort} onPress={() => onSort(option.value)} />
      ))}
    </ScrollView>
    {genres.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {genres.map((option) => (
          <Chip key={option.slug} label={option.name} selected={option.slug === genre} onPress={() => onGenre(option.slug)} />
        ))}
      </ScrollView>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  filters: {
    gap: space[2],
    paddingTop: space[2],
  },
  row: {
    gap: space[2],
  },
});
