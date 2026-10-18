import { Href, Link } from "expo-router";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, space, text } from "@/lib/theme";

type MenuRowProps = {
  label: string;
  icon: LucideIcon;
  href: Href;
  /** A count of what is new there, shown as a badge. */
  badge?: number;
};

/** One way onward from the member's corner: an icon, a name, a badge when something is new. */
export const MenuRow = ({ label, icon: Icon, href, badge = 0 }: MenuRowProps) => (
  <Link href={href} asChild>
    <Pressable accessibilityRole="link" accessibilityLabel={badge > 0 ? `${label}, ${badge} new` : label} style={styles.slot}>
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.pressed]}>
          <Icon size={20} color={colors.secondary} />
          <Text style={styles.label}>{label}</Text>
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          ) : null}
          <ChevronRight size={18} color={colors.faint} />
        </View>
      )}
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  slot: {
    alignSelf: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    ...text.base,
    flex: 1,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: space[2],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.chip,
    backgroundColor: colors.primary,
  },
  badgeText: {
    ...text.xs,
    fontFamily: fonts.bodyMedium,
    color: colors.white,
  },
});
