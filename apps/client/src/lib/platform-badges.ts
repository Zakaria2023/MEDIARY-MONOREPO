/** Badges a poster card has room for; the rest are counted, never wrapped. */
export const CARD_PLATFORM_BADGES = 3;

/**
 * The platform badges one card draws: the first few in the picker's order,
 * then "+N" for the others. Never "+1": a badge saying one more takes the
 * room the platform itself would.
 */
export const platformBadgeLabels = (badges: string[], max = CARD_PLATFORM_BADGES): string[] => {
  if (badges.length <= max) {
    return badges;
  }
  const shown = badges.slice(0, max - 1);
  return [...shown, `+${badges.length - shown.length}`];
};
