import { Link } from "expo-router";
import {
  BookOpen,
  Clapperboard,
  Disc3,
  Gamepad2,
  LucideIcon,
  Sparkles,
  SquareLibrary,
  Tv,
  Zap,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LaunchMediaType, launchMediaTypes } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { SectionHeader } from "@/components/ui/section-header";
import { colors, fonts, radius, space, text } from "@/lib/theme";

/** One icon per medium, the same ones the site's hubs carry. */
const MEDIUM_ICONS: Record<LaunchMediaType, LucideIcon> = {
  anime: Sparkles,
  game: Gamepad2,
  movie: Clapperboard,
  tv: Tv,
  music: Disc3,
  manga: SquareLibrary,
  comic: Zap,
  book: BookOpen,
};

/** Every medium as a tile, each opening its grid. */
export const MediumList = () => (
  <View style={styles.section}>
    <SectionHeader title="Browse by medium" />
    <View style={styles.grid}>
      {launchMediaTypes.map((mediaType) => {
        const Icon = MEDIUM_ICONS[mediaType];
        return (
          <Link key={mediaType} href={{ pathname: "/browse/[type]", params: { type: mediaType } }} asChild>
            <Pressable accessibilityRole="link" style={styles.slot}>
              {({ pressed }) => (
                <View style={[styles.tile, pressed && styles.pressed]}>
                  <Icon size={20} color={colors.accent} />
                  <Text style={styles.label}>{MEDIA_TYPE_PLURAL_LABELS[mediaType]}</Text>
                </View>
              )}
            </Pressable>
          </Link>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    gap: space[3],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[3],
  },
  slot: {
    flexBasis: "47%",
    flexGrow: 1,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[4],
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surface2,
  },
  label: {
    ...text.base,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
});
