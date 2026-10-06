"use client";

import Image from "next/image";
import { MemberRow as MemberRowData } from "services";
import { Badge, Button, Dropdown, FormError } from "ui";
import { formatDate } from "utils";
import { UserRole, userRoles } from "@/db/enum";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/db/label";
import { useMemberControls } from "@/app/(dashboard)/members/use-member-controls";

type MemberRowProps = {
  member: MemberRowData;
  /** Whether this row's controls are live: an admin, looking at someone else. */
  canManage: boolean;
};

const ROLE_OPTIONS = userRoles.map((value: UserRole) => ({ value, label: USER_ROLE_LABELS[value] }));

/** One member: who they are, how much they track, their role and standing. */
export const MemberRow = ({ member, canManage }: MemberRowProps) => {
  const { role, status, error, isPending, onRole, onToggleSuspended } = useMemberControls(member);

  return (
    <li className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {member.imageUrl ? (
          <Image src={member.imageUrl} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-medium text-ink">
            {member.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="line-clamp-1 text-sm font-medium text-ink">
            {member.displayName}
            {member.username ? <span className="text-muted"> @{member.username}</span> : null}
          </span>
          <span className="line-clamp-1 text-xs text-muted">
            {member.email ?? "No email"} · joined {formatDate(member.createdAt)} · {member.titles} titles
          </span>
          <FormError message={error ?? undefined} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status === "suspended" && <Badge tone="danger">{USER_STATUS_LABELS.suspended}</Badge>}
        {status === "deleted" && <Badge>{USER_STATUS_LABELS.deleted}</Badge>}
        {canManage ? (
          <>
            <div className="w-36">
              <Dropdown value={role} onChange={(value) => onRole(value as UserRole)} options={ROLE_OPTIONS} />
            </div>
            {status !== "deleted" && (
              <Button variant={status === "suspended" ? "outline" : "ghost"} size="sm" onClick={onToggleSuspended} disabled={isPending}>
                {status === "suspended" ? "Reinstate" : "Suspend"}
              </Button>
            )}
          </>
        ) : (
          <Badge tone={role === "user" ? "neutral" : "violet"}>{USER_ROLE_LABELS[role]}</Badge>
        )}
      </div>
    </li>
  );
};
