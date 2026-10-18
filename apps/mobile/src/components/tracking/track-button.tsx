import { Check, Plus } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { useTrackButton } from "@/hooks/tracking/use-track-button";

type TrackButtonProps = {
  mediaUuid: string;
};

/**
 * A title's primary action. A visitor is asked to sign in; a member who
 * does not hold it adds it; a member who does sees their status and
 * progress, and opens the sheet to change them.
 */
export const TrackButton = ({ mediaUuid }: TrackButtonProps) => {
  const { state, label, isLoading, onPress } = useTrackButton(mediaUuid);
  if (state === "visitor") {
    return <Button label="Sign in to track this" variant="primary" block onPress={onPress} />;
  }
  if (state === "add") {
    return <Button label={label} variant="primary" icon={Plus} block busy={isLoading} onPress={onPress} />;
  }
  return <Button label={label} icon={Check} block onPress={onPress} accessibilityHint="Opens your entry to change it" />;
};
