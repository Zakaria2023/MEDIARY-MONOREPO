/** One message to one person. */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** What sending answered: the sender's id for the message, or why it was not sent. */
export type EmailResult = { sent: true; id: string | null } | { sent: false; reason: string };

const API = "https://api.resend.com/emails";

/** How the sender is named in any message a person may read. Never the vendor's name. */
const SOURCE_LABEL = "The email service";

/** Whether the sender's key and the From address are present. */
export const isEmailConfigured = (): boolean =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/**
 * Sends one email through the transactional sender. The key and the From
 * address stay here; nothing else knows which sender it is. Without them
 * the message is not sent and the reason says so, in words a person may
 * read on the admin's screen.
 */
export const sendEmail = async (message: EmailMessage): Promise<EmailResult> => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    return { sent: false, reason: `${SOURCE_LABEL} is not set up yet. Its access keys are missing on the server.` };
  }
  const response = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
  });
  if (!response.ok) {
    return { sent: false, reason: `${SOURCE_LABEL} answered ${response.status}` };
  }
  const body = (await response.json().catch(() => null)) as { id?: string } | null;
  return { sent: true, id: body?.id ?? null };
};
