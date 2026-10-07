import { AuditLine as AuditLineData } from "services";
import { Badge } from "ui";
import { formatDate } from "utils";

type AuditLineProps = {
  line: AuditLineData;
};

/** "member.role" as "Member role", for the badge. */
const actionLabel = (action: string): string => {
  const [subject, verb] = action.split(".");
  const words = [subject, verb].filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** The details as a sentence: "from user to moderator", "kind review". */
const detailsText = (details: AuditLineData["details"]): string | null => {
  if (!details) {
    return null;
  }
  const parts = Object.entries(details).map(([key, value]) => `${key} ${String(value)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
};

/** One line of the log: when, who, what, to what. */
export const AuditLine = ({ line }: AuditLineProps) => (
  <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
    <time dateTime={line.createdAt.toISOString()} className="tabular w-28 shrink-0 text-xs text-faint">
      {formatDate(line.createdAt)}
    </time>
    <span className="text-ink">{line.actor?.displayName ?? "A removed account"}</span>
    <Badge>{actionLabel(line.action)}</Badge>
    <span className="text-muted">
      {line.targetKind}
      {line.targetUuid ? <span className="font-mono text-xs text-faint"> {line.targetUuid.slice(0, 8)}</span> : null}
    </span>
    {detailsText(line.details) && <span className="text-xs text-faint">{detailsText(line.details)}</span>}
  </li>
);
