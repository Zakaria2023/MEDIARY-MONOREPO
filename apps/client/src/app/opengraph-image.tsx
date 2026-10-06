import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The site-wide share image, drawn at request time: the brand mark from the
 * logo file, the name, the tagline, on the canvas. A share card is one of
 * the gradient's four permitted uses, and the mark carries it.
 *
 * The mark is read from public/brand and inlined as a data URL, because the
 * renderer has no origin to fetch a relative path from. It is painted as a
 * background image rather than an <img>, which the renderer accepts equally.
 */
const OpenGraphImage = async () => {
  const mark = await readFile(join(process.cwd(), "public/brand/mediary-mark.png"));
  const markUrl = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#090a10",
          color: "#f7f8fc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 88,
              height: 88,
              display: "flex",
              backgroundImage: `url(${markUrl})`,
              backgroundSize: "88px 88px",
            }}
          />
          <div style={{ fontSize: 44, fontWeight: 600 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.05 }}>
            {`${SITE_TAGLINE}.`}
          </div>
          <div style={{ fontSize: 28, color: "#a9afbf", maxWidth: 900 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Anime", "Games", "Movies", "TV"].map((label) => (
            <div
              key={label}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 22,
                color: "#c9cdd9",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
};

export default OpenGraphImage;
