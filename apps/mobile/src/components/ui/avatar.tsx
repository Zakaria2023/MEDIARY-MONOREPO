import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

type AvatarProps = {
  name: string;
  imageUrl: string | null;
  size: number;
};

/** Someone's picture, or their first letter when they have none. No plate behind a picture. */
export const Avatar = ({ name, imageUrl, size }: AvatarProps) => {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} accessibilityLabel={name} contentFit="cover" style={box} />;
  }
  return (
    <View accessible accessibilityLabel={name} style={[styles.initial, box]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{name.trim().charAt(0).toUpperCase() || "?"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  initial: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  letter: {
    fontFamily: fonts.display,
    color: colors.secondary,
  },
});
