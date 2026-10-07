import { describe, expect, it } from "vitest";
import { Digest, digestHasNews, renderDigestEmail } from "./digest-email";

const actor = { uuid: "u2", username: "sara", displayName: "Sara", imageUrl: null };
const title = {
  uuid: "m1",
  slug: "arrival",
  mediaType: "movie" as const,
  canonicalTitle: "Arrival <2016>",
  releaseYear: 2016,
  coverUrl: null,
  dominantColor: null,
  providerScore: 7.9,
};

const digest: Digest = {
  displayName: "Ahmad & co",
  unreadCount: 2,
  notifications: [
    { uuid: "n1", kind: "liked", readAt: null, createdAt: new Date(), actor, title, reviewHeadline: null, subject: "review" },
    { uuid: "n2", kind: "followed", readAt: null, createdAt: new Date(), actor, title: null, reviewHeadline: null, subject: null },
  ],
  continuing: [],
  friends: [],
  picks: [{ title, because: { ...title, uuid: "m2", slug: "heat", canonicalTitle: "Heat" }, sharedGenres: [] }],
};

const links = { siteUrl: "https://mediary.com", titlePath: (t: { mediaType: string; slug: string }) => `/${t.mediaType}/${t.slug}` };

describe("the weekly digest email", () => {
  it("names only Mediary, escapes what people wrote, and links to the site", () => {
    const message = renderDigestEmail(digest, "ahmad@example.com", links);
    expect(message.subject).toBe("Your week on Mediary");
    expect(message.html).toContain("Your week, Ahmad &amp; co");
    expect(message.html).toContain("Arrival &lt;2016&gt;");
    expect(message.html).toContain("Sara liked your review on Arrival");
    expect(message.html).toContain("Sara followed you");
    expect(message.html).toContain("because you loved Heat");
    expect(message.html).toContain('href="https://mediary.com/movie/arrival"');
    expect(message.html).toContain("https://mediary.com/settings/privacy");
    expect(message.text).toContain("- Sara followed you (https://mediary.com/notifications)");
    expect(message.html.toLowerCase()).not.toContain("resend");
  });

  it("knows when there is nothing to say", () => {
    expect(digestHasNews(digest)).toBe(true);
    expect(digestHasNews({ ...digest, unreadCount: 0, notifications: [], picks: [] })).toBe(false);
  });
});
