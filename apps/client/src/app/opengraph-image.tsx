import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The site-wide share image, drawn at request time: the mark, the name, the
 * tagline, on the canvas with the brand gradient as one accent. A share card
 * is one of the gradient's four permitted uses.
 */
const OpenGraphImage = () =>
  new ImageResponse(
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
              width: 64,
              height: 64,
              borderRadius: 18,
              background:
                "linear-gradient(135deg, #1697ff 0%, #4057ff 35%, #7b2cff 70%, #d815ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                marginLeft: 6,
                borderTop: "14px solid transparent",
                borderBottom: "14px solid transparent",
                borderLeft: "24px solid white",
              }}
            />
          </div>
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

export default OpenGraphImage;
