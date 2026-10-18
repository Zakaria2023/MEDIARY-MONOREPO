import { Trash2 } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Poster } from "@/components/catalog/poster";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";
import { useEntrySheet } from "@/hooks/tracking/use-entry-sheet";
import { TrackedEntry, TrackingTarget } from "@/lib/api-types";
import { colors, fonts, space, text } from "@/lib/theme";
import { FavoriteToggle } from "./favorite-toggle";
import { PlatformPicker } from "./platform-picker";
import { ProgressField } from "./progress-field";
import { ScorePicker } from "./score-picker";
import { StatusPicker } from "./status-picker";

type EntrySheetProps = {
  target: TrackingTarget;
  entry: TrackedEntry | null;
};

/**
 * THE ADD / UPDATE SHEET: the title at the top, then status, progress,
 * score, the heart, a game's platform and a note. A status alone is a
 * complete save; the rest is there when wanted.
 */
export const EntrySheet = ({ target, entry }: EntrySheetProps) => {
  const { form, status, unit, subtitle, goal, cap, progressLocked, error, isRemoving, onSubmit, onRemove, onStatusChange } =
    useEntrySheet(target, entry);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.title}>
          <Poster src={target.coverUrl} alt={target.canonicalTitle} width={56} dominantColor={target.dominantColor} radius="control" />
          <View style={styles.names}>
            <Text numberOfLines={2} accessibilityRole="header" style={styles.name}>
              {target.canonicalTitle}
            </Text>
            <Text style={styles.meta}>{subtitle}</Text>
          </View>
        </View>
        {error ? <Notice tone="error" message={error} /> : null}
        <StatusPicker mediaType={target.mediaType} value={status} onChange={onStatusChange} />
        <ProgressField control={form.control} unit={unit} goal={goal} cap={cap} locked={progressLocked} />
        <ScorePicker control={form.control} />
        <FavoriteToggle control={form.control} />
        <PlatformPicker control={form.control} platforms={target.platforms} />
        <FormField control={form.control} name="notes" label="Note" placeholder="Only you see this" multiline maxLength={2000} />
        <Button label={entry ? "Save" : "Add to library"} variant="primary" block onPress={onSubmit} />
        {entry ? (
          <Button label="Remove from library" variant="danger" icon={Trash2} block busy={isRemoving} onPress={onRemove} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    gap: space[6],
    padding: space[4],
    paddingBottom: space[12],
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  names: {
    flex: 1,
    gap: space[1],
  },
  name: {
    ...text.lg,
    fontFamily: fonts.display,
    color: colors.ink,
  },
  meta: {
    ...text.sm,
    fontFamily: fonts.body,
    color: colors.muted,
  },
});
