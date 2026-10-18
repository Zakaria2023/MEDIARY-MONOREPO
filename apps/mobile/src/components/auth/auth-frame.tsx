import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, space, text } from "@/lib/theme";

type AuthFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** Every sign-in screen's frame: the wordmark, the heading, the form, the way to the other screen. */
export const AuthFrame = ({ title, subtitle, children, footer }: AuthFrameProps) => (
  <SafeAreaView style={styles.page}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.wordmark}>Mediary</Text>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[10],
    gap: space[8],
  },
  wordmark: {
    ...text.xl,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  heading: {
    gap: space[2],
  },
  title: {
    ...text["3xl"],
    fontFamily: fonts.display,
    color: colors.ink,
  },
  subtitle: {
    ...text.base,
    fontFamily: fonts.body,
    color: colors.muted,
  },
  body: {
    gap: space[4],
  },
  footer: {
    alignItems: "center",
  },
});
