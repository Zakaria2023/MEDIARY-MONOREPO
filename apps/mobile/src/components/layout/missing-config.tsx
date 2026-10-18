import { Settings } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { StateMessage } from "@/components/ui/state-message";
import { colors } from "@/lib/theme";

/** A build made without its sign-in settings: says so plainly, and names nothing it is missing. */
export const MissingConfig = () => (
  <View style={styles.page}>
    <StateMessage
      icon={Settings}
      title="This build is not set up yet"
      body="Signing in is not available on this build. Install the latest version of Mediary."
    />
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.page,
  },
});
