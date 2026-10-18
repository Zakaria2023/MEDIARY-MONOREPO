import { StyleSheet, Text, View } from "react-native";
import { welcomeSchema } from "validators";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";
import { colors, fonts, text } from "@/lib/theme";

const valid = welcomeSchema.safeParse({ username: "mediary", displayName: "Mediary" }).success;

const Home = () => (
  <View style={styles.page}>
    <Text style={styles.title}>Mediary</Text>
    <Text style={styles.body}>{Object.values(MEDIA_TYPE_PLURAL_LABELS).join(" · ")}</Text>
    <Text style={styles.body}>{valid ? "Shared schemas load" : "Shared schemas failed"}</Text>
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.page },
  title: { ...text["3xl"], fontFamily: fonts.display, color: colors.ink },
  body: { ...text.sm, fontFamily: fonts.body, color: colors.muted },
});

export default Home;
