import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { MediaType } from "@/db/enum";
import { CatalogTitle } from "@/lib/api-types";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type GenreChipsProps = {
  mediaType: MediaType;
  genres: CatalogTitle["genres"];
};

/** A title's genres, each opening its medium's grid on that genre. */
export const GenreChips = ({ mediaType, genres }: GenreChipsProps) =>
  genres.length === 0 ? null : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {genres.map((genre) => (
        <Link
          key={genre.slug}
          href={{ pathname: "/browse/[type]", params: { type: mediaType, genre: genre.slug } }}
          style={styles.chip}
        >
          <Text style={styles.label}>{genre.name}</Text>
        </Link>
      ))}
    </ScrollView>
  );

const styles = StyleSheet.create({
  row: {
    gap: space[2],
    paddingHorizontal: space[4],
  },
  chip: {
    paddingHorizontal: space[3],
    paddingVertical: space[1],
    borderRadius: radius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  label: {
    ...text.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.secondary,
  },
});
