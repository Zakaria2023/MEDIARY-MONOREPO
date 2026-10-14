"use client";

import Link from "next/link";
import { CreatorCampaignRow, ListSummary } from "services";
import { Badge, Button, Dropdown, FormError } from "ui";
import { formatDate } from "utils";
import { CREATOR_CAMPAIGN_STATUS_LABELS } from "@/db/label";
import { useCampaignAnswer } from "@/app/(app)/studio/use-campaign-answer";

type CreatorCampaignCardProps = {
  invitation: CreatorCampaignRow;
  /** The creator's public lists: the work an acceptance points at. */
  lists: Pick<ListSummary, "uuid" | "name">[];
};

/**
 * One brand's invitation: who, what is asked, the disclosure the work will
 * carry, and the answer. Accepting takes one of the creator's public lists
 * as the work, and that list then says whose partnership it is.
 */
export const CreatorCampaignCard = ({ invitation, lists }: CreatorCampaignCardProps) => {
  const { state, isPending, listUuid, setListUuid, onAccept, onDecline } = useCampaignAnswer(invitation.uuid, invitation.list?.uuid ?? null);
  const options = lists.map((list) => ({ value: list.uuid, label: list.name }));

  return (
    <li className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={invitation.status === "accepted" ? "success" : invitation.status === "declined" ? "neutral" : "warning"}>
          {CREATOR_CAMPAIGN_STATUS_LABELS[invitation.status]}
        </Badge>
        <span className="text-sm font-medium text-ink">{invitation.sponsor}</span>
        <span className="text-xs text-muted">
          {invitation.campaign.name} · {formatDate(invitation.campaign.startsAt)} to {formatDate(invitation.campaign.endsAt)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">What is asked</span>
        <p className="whitespace-pre-line text-sm text-secondary">{invitation.deliverables}</p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">What your list will say</span>
        <p className="text-sm text-secondary">
          Paid partnership with {invitation.sponsor}. {invitation.disclosure}
        </p>
      </div>
      {invitation.list && (
        <p className="text-sm text-muted">
          The work:{" "}
          <Link href={`/lists/${invitation.list.slug}`} className="text-accent hover:text-accent-hover">
            {invitation.list.name}
          </Link>
        </p>
      )}
      {lists.length === 0 ? (
        <p className="text-sm text-muted">
          To accept, first make a public list for this work on your <Link href="/lists" className="text-accent hover:text-accent-hover">lists page</Link>.
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-sm font-medium text-ink">The list that is the work</span>
            <Dropdown value={listUuid ?? ""} onChange={setListUuid} options={options} placeholder="Pick one of your public lists" />
          </div>
          <div className="flex gap-2">
            {invitation.status !== "declined" && (
              <Button variant="ghost" onClick={onDecline} disabled={isPending}>
                Decline
              </Button>
            )}
            <Button variant="outline" onClick={onAccept} disabled={isPending || !listUuid}>
              {invitation.status === "accepted" ? "Change the list" : "Accept"}
            </Button>
          </div>
        </div>
      )}
      <FormError message={state.error} />
    </li>
  );
};
