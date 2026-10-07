import { FeatureFlag, featureFlags } from "../../../db/enum";
import { ValidationError } from "./errors";

export type FeatureFlags = Record<FeatureFlag, boolean>;

/** What a person reads when they reach a switched-off feature. */
export const FEATURE_OFF_MESSAGE = "This is switched off for now";

/**
 * FEATURE FLAGS: a finished feature can be taken off the site by naming it
 * in `FEATURES_OFF`, comma separated, without a deploy. Read on every call,
 * not at module load, so a flipped variable takes effect on the next
 * request and a test can set it.
 *
 * Every flag defaults to on. The services that do the thing check the flag
 * themselves (`assertFeature`), so a screen that forgot to hide a button
 * still cannot write; the screens read `isFeatureOn` only to hide what
 * would be refused.
 */
const switchedOff = (): Set<string> =>
  new Set(
    (process.env.FEATURES_OFF ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );

export const isFeatureOn = (flag: FeatureFlag): boolean => !switchedOff().has(flag);

export const getFeatureFlags = (): FeatureFlags => {
  const off = switchedOff();
  const flags = {} as FeatureFlags;
  for (const flag of featureFlags) {
    flags[flag] = !off.has(flag);
  }
  return flags;
};

/** Refuses, in the words a person reads, when the flag is off. */
export const assertFeature = (flag: FeatureFlag): void => {
  if (!isFeatureOn(flag)) {
    throw new ValidationError(FEATURE_OFF_MESSAGE);
  }
};
