import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { colors, fonts, space, text } from "@/lib/theme";

type ProfileHeaderProps = {
  displayName: string;
  username: string;
  imageUrl: string | null;
  bio?: string | null;
  /** Follow, or anything else the viewer can do here. */
  action?: ReactNode;
};

/** Who someone is: their picture, name, handle and, when they wrote one, their bio. */
export const ProfileHeader = ({ displayName, username, imageUrl, bio, action }: ProfileHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.row}>
      <Avatar name={displayName} imageUrl={imageUrl} size={64} />
      <View style={styles.names}>
        <Text accessibilityRole="header" style={styles.name}>
          {displayName}
        </Text>
        <Text style={styles.handle}>@{username}</Text>
      </View>
    </View>
    {bio ? <Text style={styles.bio}>{bio}</Text> : null}
    {action}
  </View>
);

const styles = StyleSheet.create({
  header: {
    gap: space[4],
    paddingTop: space[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[4],
  },
  names: {
    flex: 1,
    gap: space[1],
  },
  name: {
    ...text.xl,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  handle: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  bio: {
    ...text.base,
    fontFamily: fonts.body,
    color: colors.secondary,
  },
});
