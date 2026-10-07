import { MEDIA_TYPE_LABELS, NOTIFICATION_VERBS } from "../../../db/label";
import { FeedItem } from "./activities";
import { EmailMessage } from "./email";
import { NotificationItem } from "./notifications";
import { Recommendation } from "./recommendations";
import { LibraryItem } from "./tracking";

/** Everything one person's weekly email says. */
export type Digest = {
  displayName: string;
  unreadCount: number;
  notifications: NotificationItem[];
  continuing: LibraryItem[];
  friends: FeedItem[];
  picks: Recommendation[];
};

/** How the links in the email are built; the site's address, never a vendor's. */
export type DigestLinks = {
  siteUrl: string;
  titlePath: (title: { mediaType: string; slug: string }) => string;
};

/** The digest's subject line. */
const SUBJECT = "Your week on Mediary";

const escape = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Whether a digest has anything worth an email. */
export const digestHasNews = (digest: Digest): boolean =>
  digest.unreadCount > 0 || digest.continuing.length > 0 || digest.friends.length > 0 || digest.picks.length > 0;

/** A notification as one sentence. */
const notificationSentence = (item: NotificationItem): string => {
  const verb = NOTIFICATION_VERBS[item.kind];
  const object = item.subject === "review" ? " review" : item.subject === "activity" ? " activity" : "";
  const title = item.title ? ` on ${item.title.canonicalTitle}` : "";
  return `${item.actor.displayName} ${verb}${object}${title}`;
};

/**
 * THE EMAIL, as plain HTML in the brand's own colors and as text. Only
 * Mediary is named in it. Links go to the site; nothing in it needs a
 * script or an image to read.
 */
export const renderDigestEmail = (digest: Digest, to: string, links: DigestLinks): EmailMessage => {
  const section = (heading: string, lines: { text: string; href: string | null }[]): string =>
    lines.length === 0
      ? ""
      : `<h2 style="margin:28px 0 8px;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;color:#A9AFBF">${escape(heading)}</h2>` +
        lines
          .map(
            (line) =>
              `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#F7F8FC">${
                line.href ? `<a href="${escape(line.href)}" style="color:#1697FF;text-decoration:none">${escape(line.text)}</a>` : escape(line.text)
              }</p>`,
          )
          .join("");
  const textSection = (heading: string, lines: { text: string; href: string | null }[]): string =>
    lines.length === 0 ? "" : `\n${heading.toUpperCase()}\n${lines.map((line) => `- ${line.text}${line.href ? ` (${line.href})` : ""}`).join("\n")}\n`;

  const notifications = digest.notifications.map((item) => ({ text: notificationSentence(item), href: `${links.siteUrl}/notifications` }));
  const continuing = digest.continuing.map((item) => ({
    text: `${item.title.canonicalTitle} (${MEDIA_TYPE_LABELS[item.title.mediaType]})`,
    href: `${links.siteUrl}${links.titlePath(item.title)}`,
  }));
  const friends = digest.friends.flatMap((item) =>
    item.title ? [{ text: `${item.actor.displayName}: ${item.title.canonicalTitle}`, href: `${links.siteUrl}${links.titlePath(item.title)}` }] : [],
  );
  const picks = digest.picks.map((pick) => ({
    text: pick.because ? `${pick.title.canonicalTitle}, because you loved ${pick.because.canonicalTitle}` : pick.title.canonicalTitle,
    href: `${links.siteUrl}${links.titlePath(pick.title)}`,
  }));
  const unread =
    digest.unreadCount > 0
      ? `${digest.unreadCount} ${digest.unreadCount === 1 ? "thing" : "things"} waiting for you`
      : "Nothing waiting for you";

  const html = `<!doctype html><html><body style="margin:0;background:#090A10;padding:32px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#11131C;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:28px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#A9AFBF">Mediary</p>
<h1 style="margin:0 0 6px;font-size:22px;color:#F7F8FC">Your week, ${escape(digest.displayName)}</h1>
<p style="margin:0;font-size:15px;color:#A9AFBF">${escape(unread)}.</p>
${section("Reached you", notifications)}
${section("Pick up where you left off", continuing)}
${section("Friends", friends)}
${section("For you", picks)}
<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#A9AFBF">You get this once a week because the weekly email is on in your <a href="${escape(links.siteUrl)}/settings/privacy" style="color:#1697FF;text-decoration:none">settings</a>. Switch it off there any time.</p>
</div></body></html>`;

  const text = `Mediary\nYour week, ${digest.displayName}\n${unread}.\n${textSection("Reached you", notifications)}${textSection("Pick up where you left off", continuing)}${textSection("Friends", friends)}${textSection("For you", picks)}\nYou get this once a week because the weekly email is on in your settings: ${links.siteUrl}/settings/privacy`;

  return { to, subject: SUBJECT, html, text };
};

