import { Image } from "expo-image";
import { ImageOff } from "lucide-react-native";
import { PixelRatio, StyleSheet, View } from "react-native";
import { catalogImageUrl } from "utils";
import { colors, POSTER_RATIO, radius as radii } from "@/lib/theme";

type PosterProps = {
  src: string | null;
  /** The title's name, read out in its place. */
  alt: string;
  /** The slot's width in points; the image is asked for at the screen's density. */
  width: number;
  /** Painted while the image loads, when the catalog knows one. */
  dominantColor?: string | null;
  /** A record's sleeve is square; everything else is a 2:3 poster. */
  shape?: "poster" | "square";
  /** A card's corner, or a control's beside a line of text. */
  radius?: "card" | "control";
};

/**
 * A title's poster, as on the site: the artwork straight on the surface,
 * no plate behind it; the title's own color while it loads; the outlined
 * placeholder when there is no artwork, so a row never loses its image.
 * The image is asked of the provider's CDN at the size the slot needs.
 */
export const Poster = ({ src, alt, width, dominantColor, shape = "poster", radius = "card" }: PosterProps) => {
  const height = shape === "square" ? width : width / POSTER_RATIO;
  const corner = radius === "card" ? radii.card : radii.control;
  const box = { width, height, borderRadius: corner };
  if (!src) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={alt} style={[styles.empty, box]}>
        <ImageOff size={Math.min(20, width / 3)} color={colors.faint} />
      </View>
    );
  }
  return (
    <View style={[styles.frame, box, dominantColor ? { backgroundColor: dominantColor } : null]}>
      <Image
        source={{ uri: catalogImageUrl(src, PixelRatio.getPixelSizeForLayoutSize(width)) }}
        accessibilityLabel={alt}
        contentFit="cover"
        transition={150}
        recyclingKey={src}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairlineStrong,
  },
});
