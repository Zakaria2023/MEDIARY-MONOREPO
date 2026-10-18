import { StyleSheet, Text, View } from "react-native";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { useGoogleSignIn } from "@/hooks/auth/use-google-sign-in";
import { colors, fonts, space, text } from "@/lib/theme";

/** "or", then "Continue with Google", with its own refusal under it. */
export const GoogleButton = () => {
  const { error, isBusy, onGoogle } = useGoogleSignIn();
  return (
    <View style={styles.block}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>or</Text>
        <View style={styles.line} />
      </View>
      {error ? <Notice tone="error" message={error} /> : null}
      <Button label="Continue with Google" block busy={isBusy} onPress={onGoogle} />
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    gap: space[4],
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairlineStrong,
  },
  or: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.faint,
  },
});
