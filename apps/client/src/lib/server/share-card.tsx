import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ReactNode } from "react";

/** One number with its name, on a card. */
export type CardStat = {
  label: string;
  value: string;
};

type CardFrameProps = {
  /** A small line above the headline: "Taste Match", "2026 on Mediary". */
  kicker: string;
  headline: string;
  /** A sentence under the headline. */
  line: string;
  stats: CardStat[];
  /** Something on the start edge: a ring, an avatar pair. */
  aside?: ReactNode;
  markUrl: string;
};

/** Every share card is this size; the chat apps and feeds expect it. */
export const CARD_SIZE = { width: 1200, height: 630 };

/** The brand mark as a data URL the image renderer can paint. */
export const loadMark = async (): Promise<string> => {
  const mark = await readFile(join(process.cwd(), "public/brand/mediary-mark.png"));
  return `data:image/png;base64,${mark.toString("base64")}`;
};

/**
 * THE SHARE CARD'S FRAME: the canvas, the kicker, the headline, a line,
 * a row of numbers and the mark. One of the gradient's permitted places,
 * carried by a soft wash behind the content. Drawn with the image
 * renderer's flexbox subset, so every box says display: flex.
 */
const CardFrame = ({ kicker, headline, line, stats, aside, markUrl }: CardFrameProps) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      gap: 56,
      padding: 72,
      background: "linear-gradient(135deg, #0f1324 0%, #090a10 55%, #14102a 100%)",
      color: "#f7f8fc",
      fontFamily: "sans-serif",
    }}
  >
    {aside}
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, height: 486 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", fontSize: 26, color: "#a9afbf", letterSpacing: 2, textTransform: "uppercase" }}>
          {kicker}
        </div>
        <div style={{ display: "flex", fontSize: headline.length > 28 ? 56 : 72, fontWeight: 600, lineHeight: 1.05 }}>
          {headline}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#c9cdd9", lineHeight: 1.3 }}>{line}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", gap: 40 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 600 }}>{stat.value}</div>
              <div style={{ display: "flex", fontSize: 22, color: "#a9afbf" }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, display: "flex", backgroundImage: `url(${markUrl})`, backgroundSize: "48px 48px" }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>Mediary</div>
        </div>
      </div>
    </div>
  </div>
);

/** A match percentage as a ring, the renderer's way: a conic sweep behind a disc. */
const MatchRingGraphic = ({ value }: { value: number }) => (
  <div
    style={{
      width: 260,
      height: 260,
      display: "flex",
      flexShrink: 0,
      borderRadius: 130,
      background: `conic-gradient(#1697ff 0deg, #7b2cff ${value * 1.8}deg, #d815ff ${value * 3.6}deg, rgba(255,255,255,0.1) ${value * 3.6}deg)`,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 212,
        height: 212,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 106,
        background: "#090a10",
      }}
    >
      <div style={{ display: "flex", fontSize: 72, fontWeight: 600 }}>{value}%</div>
      <div style={{ display: "flex", fontSize: 24, color: "#a9afbf" }}>match</div>
    </div>
  </div>
);

type MatchCardInput = {
  viewerName: string;
  otherName: string;
  overall: number;
  confidence: number;
  stats: CardStat[];
};

/** The Taste Match share card: the ring, the two names, the per-medium numbers. */
export const matchCard = async ({ viewerName, otherName, overall, confidence, stats }: MatchCardInput) =>
  new ImageResponse(
    (
      <CardFrame
        kicker="Taste Match"
        headline={`${viewerName} & ${otherName}`}
        line={
          confidence > 0
            ? `${confidence} titles in common, and the scores to prove it.`
            : "Built from the genres each of you leans on."
        }
        stats={stats}
        aside={<MatchRingGraphic value={overall} />}
        markUrl={await loadMark()}
      />
    ),
    CARD_SIZE,
  );

type RecapCardInput = {
  name: string;
  year: number;
  line: string;
  stats: CardStat[];
};

/** The yearly recap card: a person's year in four numbers. */
export const recapCard = async ({ name, year, line, stats }: RecapCardInput) =>
  new ImageResponse(
    (
      <CardFrame
        kicker={`${year} on Mediary`}
        headline={`${name}'s year`}
        line={line}
        stats={stats}
        markUrl={await loadMark()}
      />
    ),
    CARD_SIZE,
  );

type ProfileCardInput = {
  name: string;
  username: string;
  line: string;
  stats: CardStat[];
  avatarUrl: string | null;
};

/** A profile's share image: the name, the handle, a line about the taste, the counts. */
export const profileCard = async ({ name, username, line, stats, avatarUrl }: ProfileCardInput) =>
  new ImageResponse(
    (
      <CardFrame
        kicker={`@${username}`}
        headline={name}
        line={line}
        stats={stats}
        aside={
          <div
            style={{
              width: 220,
              height: 220,
              display: "flex",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 110,
              border: "2px solid rgba(255,255,255,0.14)",
              background: avatarUrl ? `url(${avatarUrl})` : "#171a26",
              backgroundSize: "220px 220px",
              fontSize: 88,
              fontWeight: 600,
            }}
          >
            {avatarUrl ? "" : name.slice(0, 1).toUpperCase()}
          </div>
        }
        markUrl={await loadMark()}
      />
    ),
    CARD_SIZE,
  );
