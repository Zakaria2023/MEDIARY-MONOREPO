import { Href } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import { SectionHeader } from "@/components/ui/section-header";
import { CatalogCard } from "@/lib/api-types";
import { space } from "@/lib/theme";
import { PosterCard } from "./poster-card";

type PosterRailProps = {
  title: string;
  cards: CatalogCard[];
  href?: Href;
};

/** The width of a card on a rail: three and a bit across a phone, so the next one says "scroll". */
export const RAIL_CARD_WIDTH = 112;

/** A row of posters under a heading, scrolled sideways. Renders nothing when empty. */
export const PosterRail = ({ title, cards, href }: PosterRailProps) =>
  cards.length === 0 ? null : (
    <View style={styles.rail}>
      <View style={styles.header}>
        <SectionHeader title={title} href={href} />
      </View>
      <FlatList
        horizontal
        data={cards}
        keyExtractor={(card) => card.uuid}
        renderItem={({ item }) => <PosterCard card={item} width={RAIL_CARD_WIDTH} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      />
    </View>
  );

const styles = StyleSheet.create({
  rail: {
    gap: space[3],
  },
  header: {
    paddingHorizontal: space[4],
  },
  row: {
    gap: space[3],
    paddingHorizontal: space[4],
  },
});
