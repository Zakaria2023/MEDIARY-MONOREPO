import { useAuth } from "@clerk/expo";
import { Redirect, useLocalSearchParams } from "expo-router";
import { CloudOff } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { EntrySheet } from "@/components/tracking/entry-sheet";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { StateMessage } from "@/components/ui/state-message";
import { useTracking } from "@/hooks/tracking/use-tracking";
import { colors } from "@/lib/theme";

type EntryParams = {
  mediaUuid: string;
};

/** The sheet over a title, a library row or a home card: `/entry/<title uuid>`. Members only. */
const EntryScreen = () => {
  const { mediaUuid } = useLocalSearchParams<EntryParams>();
  const { isLoaded, isSignedIn } = useAuth();
  const tracking = useTracking(mediaUuid);
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  if (tracking.isPending) {
    return <LoadingScreen />;
  }
  if (tracking.isError) {
    return (
      <View style={styles.page}>
        <StateMessage
          icon={CloudOff}
          title="This title did not open"
          body={tracking.error.message}
          actionLabel="Try again"
          onAction={() => void tracking.refetch()}
        />
      </View>
    );
  }
  return <EntrySheet target={tracking.data.target} entry={tracking.data.entry} />;
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});

export default EntryScreen;
