import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../../db";
import { UserSettings } from "../../../db/schema/user-settings";
import { Users } from "../../../db/schema/users";
import { listFeed } from "./activities";
import { Digest, digestHasNews, DigestLinks, renderDigestEmail } from "./digest-email";
import { EmailResult, isEmailConfigured, sendEmail } from "./email";
import { countUnreadNotifications, listNotifications } from "./notifications";
import { listRecommendations } from "./recommendations";
import { listContinueEntries } from "./tracking";

/** One person the digest goes to. */
export type DigestRecipient = {
  userUuid: string;
  email: string;
};

/** The tally of one run. */
export type DigestSummary = {
  recipients: number;
  sent: number;
  skipped: number;
  failed: { email: string; reason: string }[];
};

/** Everyone who left the weekly email on, with a verified address. */
export const listDigestRecipients = async (): Promise<DigestRecipient[]> => {
  const rows = await db
    .select({ userUuid: Users.uuid, email: Users.email })
    .from(Users)
    .innerJoin(UserSettings, eq(UserSettings.userUuid, Users.uuid))
    .where(and(eq(Users.status, "active"), eq(UserSettings.emailDigest, true), isNotNull(Users.email)));
  return rows.flatMap((row) => (row.email ? [{ userUuid: row.userUuid, email: row.email }] : []));
};

/** One person's week: what reached them, what they are in the middle of, what friends did, what to try. */
export const buildDigest = async (userUuid: string): Promise<Digest | null> => {
  const [user] = await db.select({ displayName: Users.displayName }).from(Users).where(eq(Users.uuid, userUuid));
  if (!user) {
    return null;
  }
  const [unreadCount, notifications, continuing, friends, picks] = await Promise.all([
    countUnreadNotifications(userUuid),
    listNotifications(userUuid, { pageSize: 5 }),
    listContinueEntries(userUuid, 4),
    listFeed(userUuid, { pageSize: 5 }),
    listRecommendations(userUuid, { limit: 4 }),
  ]);
  return {
    displayName: user.displayName,
    unreadCount,
    notifications: notifications.items.filter((item) => item.readAt === null),
    continuing,
    friends: friends.items,
    picks,
  };
};

/**
 * THE WEEKLY JOB. Everyone with the email on gets their week, when there
 * is anything in it. Without a sender configured nothing is sent and the
 * summary says so once; one address failing never stops the rest.
 */
export const runWeeklyDigest = async (links: DigestLinks): Promise<DigestSummary> => {
  const recipients = await listDigestRecipients();
  const summary: DigestSummary = { recipients: recipients.length, sent: 0, skipped: 0, failed: [] };
  if (!isEmailConfigured()) {
    const result: EmailResult = await sendEmail({ to: "", subject: "", html: "", text: "" });
    summary.failed.push({ email: "everyone", reason: result.sent ? "Unknown" : result.reason });
    summary.skipped = recipients.length;
    return summary;
  }
  for (const recipient of recipients) {
    try {
      const digest = await buildDigest(recipient.userUuid);
      if (!digest || !digestHasNews(digest)) {
        summary.skipped += 1;
        continue;
      }
      const result = await sendEmail(renderDigestEmail(digest, recipient.email, links));
      if (result.sent) {
        summary.sent += 1;
      } else {
        summary.failed.push({ email: recipient.email, reason: result.reason });
      }
    } catch (error) {
      summary.failed.push({ email: recipient.email, reason: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  return summary;
};
