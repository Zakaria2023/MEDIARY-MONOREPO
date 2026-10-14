"use client";

import { BadgeCheck, CircleCheck, CircleHelp, CircleX, Search, UserX, X } from "lucide-react";
import Image from "next/image";
import { CreatorRequestRow as CreatorRequestRowData } from "services";
import { Badge, Button, FormError, Input } from "ui";
import { formatCount, formatDate } from "utils";
import { CREATOR_CATEGORY_LABELS, CREATOR_STATUS_LABELS } from "@/db/label";
import { useCreatorReview } from "@/app/(dashboard)/creators/use-creator-review";
import { publicProfileUrl } from "@/lib/site";

type CreatorRequestRowProps = {
  request: CreatorRequestRowData;
  /** An admin may take a standing badge away. */
  canRevoke: boolean;
};

/**
 * One request or one creator. A waiting request shows the code, the
 * channels to look for it on, a check that looks for it, and the decision;
 * a verified creator shows when, and, for an admin, the way to revoke.
 */
export const CreatorRequestRow = ({ request, canRevoke }: CreatorRequestRowProps) => {
  const { note, setNote, checks, decided, error, isChecking, isPending, onCheck, onDecide } = useCreatorReview(request.uuid);
  if (decided) {
    return null;
  }
  const pending = request.status === "pending";

  return (
    <li className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-center gap-3">
        {request.user.imageUrl ? (
          <Image src={request.user.imageUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-ink">
            {request.user.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-1 text-sm font-medium text-ink">
            {request.user.displayName}
            {request.user.username && (
              <a href={publicProfileUrl(request.user.username)} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
                {" "}
                @{request.user.username}
              </a>
            )}
          </span>
          <span className="line-clamp-1 text-xs text-muted">
            {request.user.email ?? "No email"} · {formatCount(request.followers)} followers ·{" "}
            {pending ? `asked ${formatDate(request.requestedAt)}` : `${CREATOR_STATUS_LABELS[request.status].toLowerCase()} ${formatDate(request.reviewedAt)}`}
          </span>
        </div>
        <Badge tone="accent" icon={<BadgeCheck size={12} />}>
          {CREATOR_CATEGORY_LABELS[request.category]}
        </Badge>
      </div>

      {pending && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Look for <span className="select-all font-mono text-ink">{request.code}</span> in the bio of one of these:
          </p>
          <ul className="flex flex-col gap-1.5">
            {request.proofUrls.map((url) => {
              const check = checks?.find((entry) => entry.url === url);
              return (
                <li key={url} className="flex items-center gap-2 text-sm">
                  {check?.found === true && <CircleCheck size={15} className="shrink-0 text-success" aria-label="Code found" />}
                  {check?.found === false && <CircleX size={15} className="shrink-0 text-danger" aria-label="Code not found" />}
                  {check && check.found === null && <CircleHelp size={15} className="shrink-0 text-warning" aria-label="Could not be read" />}
                  <a href={url} target="_blank" rel="noreferrer" className="line-clamp-1 break-all text-accent hover:text-accent-hover">
                    {url}
                  </a>
                </li>
              );
            })}
          </ul>
          {checks && checks.some((check) => check.found === null) && (
            <p className="text-xs text-muted">Some pages could not be read from the server; open them and look for the code yourself.</p>
          )}
          {request.requestNote && <p className="text-sm text-secondary">“{request.requestNote}”</p>}
        </div>
      )}

      <FormError message={error ?? undefined} />

      {(pending || (canRevoke && request.status === "verified")) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Note to the member"
              placeholder={pending ? "Optional; shown if refused" : "Optional; why the badge is taken away"}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={300}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {pending ? (
              <>
                <Button variant="ghost" size="sm" onClick={onCheck} disabled={isChecking || isPending}>
                  <Search size={14} />
                  {isChecking ? "Looking" : "Look for the code"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDecide("reject")} disabled={isPending}>
                  <X size={14} />
                  Refuse
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDecide("verify")} disabled={isPending}>
                  <BadgeCheck size={14} />
                  Verify
                </Button>
              </>
            ) : (
              <Button variant="danger" size="sm" onClick={() => onDecide("revoke")} disabled={isPending}>
                <UserX size={14} />
                Revoke the badge
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};
