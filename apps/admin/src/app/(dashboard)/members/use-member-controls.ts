"use client";

import { useState, useTransition } from "react";
import { MemberRow } from "services";
import { UserRole } from "@/db/enum";
import { setMemberRoleAction, setMemberStatusAction } from "./actions";

/**
 * One member's controls: the role picker and the suspend switch. Each
 * change shows at once and reverts, with the server's words, if refused.
 */
export const useMemberControls = (member: MemberRow) => {
  const [role, setRole] = useState<UserRole>(member.role);
  const [status, setStatus] = useState(member.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onRole = (next: UserRole) => {
    const previous = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      const result = await setMemberRoleAction({ userUuid: member.uuid, role: next });
      if (!result.success) {
        setRole(previous);
        setError(result.error ?? "Could not change this role");
      }
    });
  };

  const onToggleSuspended = () => {
    const next = status === "suspended" ? "active" : "suspended";
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await setMemberStatusAction({ userUuid: member.uuid, status: next });
      if (!result.success) {
        setStatus(previous);
        setError(result.error ?? "Could not change this account");
      }
    });
  };

  return { role, status, error, isPending, onRole, onToggleSuspended };
};
