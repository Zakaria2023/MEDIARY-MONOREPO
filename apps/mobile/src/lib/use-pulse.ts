import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";

/** The browser build has no native animation driver; it animates on the JS thread instead. */
const NATIVE_DRIVER = Platform.OS !== "web";

/**
 * A skeleton's slow breathing, as an opacity. Still, at its resting value,
 * when the person has asked the device for less motion.
 */
export const usePulse = (): Animated.Value => {
  const [opacity] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) {
        return;
      }
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
          Animated.timing(opacity, { toValue: 0.55, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);
  return opacity;
};
