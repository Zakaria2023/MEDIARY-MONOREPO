import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { catalogImageUrl } from "utils";
import { MEDIA_TYPE_LABELS } from "@/db/label";
import { loadTitle } from "@/lib/load-title";
import { inlineImage } from "@/lib/server/inline-image";

type Props = {
  params: Promise<{ type: string; slug: string }>;
};

export const alt = "A title on Mediary: its poster, name and genres";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * A TITLE'S SHARE CARD, what a link to it shows in a chat or a feed: the
 * poster, the name, the medium and year, its genres, and Mediary's mark.
 * Drawn per title at request time; a share card is one of the gradient's
 * permitted places, carried here by the mark.
 */
const TitleOpenGraphImage = async ({ params }: Props) => {
  const { type, slug } = await params;
  const title = await loadTitle(type, slug);
  const mark = await readFile(join(process.cwd(), "public/brand/mediary-mark.png"));
  const markUrl = `data:image/png;base64,${mark.toString("base64")}`;
  const poster = title?.coverUrl ? await inlineImage(catalogImageUrl(title.coverUrl, 500)) : null;
  const name = title?.canonicalTitle ?? "Mediary";
  const meta = title
    ? [MEDIA_TYPE_LABELS[title.mediaType], title.releaseYear].filter(Boolean).join(" · ")
    : "Your entertainment, beautifully tracked";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: 72,
          background: "#090a10",
          color: "#f7f8fc",
          fontFamily: "sans-serif",
        }}
      >
        {poster && (
          <div
            style={{
              width: 320,
              height: 480,
              display: "flex",
              flexShrink: 0,
              borderRadius: 18,
              backgroundImage: `url(${poster})`,
              backgroundSize: "320px 480px",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 480, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#a9afbf" }}>{meta}</div>
            <div style={{ display: "flex", fontSize: name.length > 30 ? 60 : 76, fontWeight: 600, lineHeight: 1.05 }}>
              {name}
            </div>
            {title && title.genres.length > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                {title.genres.slice(0, 3).map((genre) => (
                  <div
                    key={genre.slug}
                    style={{
                      display: "flex",
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.14)",
                      fontSize: 22,
                      color: "#c9cdd9",
                    }}
                  >
                    {genre.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                display: "flex",
                backgroundImage: `url(${markUrl})`,
                backgroundSize: "56px 56px",
              }}
            />
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>Mediary</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
};

export default TitleOpenGraphImage;
