import "server-only";

/**
 * A remote image as a data URL that an ImageResponse can paint, or null if
 * it cannot be fetched. A share card renders without the image rather than
 * failing when a provider's CDN hiccups.
 */
export const inlineImage = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get("content-type") ?? "image/jpeg";
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
};
