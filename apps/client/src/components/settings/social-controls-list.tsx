"use client";

import Link from "next/link";
import { ControlledUser, SocialControls } from "services";
import { Button, FormError } from "ui";
import { formatDate } from "utils";
import { UserAvatar } from "@/components/profile/user-avatar";
import { useSocialControls } from "@/app/(app)/settings/privacy/use-social-controls";
import { profilePath } from "@/lib/profile-path";

type SocialControlsListProps = {
  initial: SocialControls;
};

type ListProps = {
  heading: string;
  empty: string;
  people: ControlledUser[];
  verb: string;
  onUndo: (userUuid: string) => void;
  disabled: boolean;
};

const ControlledList = ({ heading, empty, people, verb, onUndo, disabled }: ListProps) => (
  <div className="flex flex-col gap-2">
    <span className="text-sm font-medium text-ink">{heading}</span>
    {people.length === 0 ? (
      <p className="text-sm text-muted">{empty}</p>
    ) : (
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {people.map((person) => (
          <li key={person.uuid} className="flex items-center gap-3 py-2.5">
            <UserAvatar name={person.displayName} imageUrl={person.imageUrl} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col">
              {person.username ? (
                <Link href={profilePath(person.username)} className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-accent">
                  {person.displayName}
                </Link>
              ) : (
                <span className="line-clamp-1 text-sm font-medium text-ink">{person.displayName}</span>
              )}
              <span className="text-xs text-faint">Since {formatDate(person.since)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onUndo(person.uuid)} disabled={disabled}>
              {verb}
            </Button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

/** Whom you have blocked or muted, with the way back. */
export const SocialControlsList = ({ initial }: SocialControlsListProps) => {
  const { blocked, muted, error, isPending, onUnblock, onUnmute } = useSocialControls(initial);

  return (
    <section id="blocked" className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Blocked and muted</h2>
        <p className="text-sm text-muted">
          A blocked account cannot see you or reach you, and you cannot see it. A muted account only leaves your feed, and is not told.
        </p>
      </div>
      <ControlledList heading="Blocked" empty="You have blocked no one." people={blocked} verb="Unblock" onUndo={onUnblock} disabled={isPending} />
      <ControlledList heading="Muted" empty="You have muted no one." people={muted} verb="Unmute" onUndo={onUnmute} disabled={isPending} />
      <FormError message={error ?? undefined} />
    </section>
  );
};
