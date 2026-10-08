/** A song's length as a player shows it: "4:44", "1:02:10". Null for one the catalog does not know. */
export const formatTrackLength = (seconds: number | null): string | null => {
  if (seconds === null || seconds <= 0) {
    return null;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};

/** A song's length in schema.org's terms: "PT4M44S". */
export const isoTrackLength = (seconds: number): string => `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
