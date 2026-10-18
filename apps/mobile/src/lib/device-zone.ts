/**
 * The device's own time zone, which is the member's: the day a save
 * happens in, and the day a diary moment is drawn under.
 */
export const deviceZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
