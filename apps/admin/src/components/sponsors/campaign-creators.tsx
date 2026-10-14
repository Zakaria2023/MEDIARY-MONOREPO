import { listCampaignCreators } from "services";
import { Badge } from "ui";
import { formatDate } from "utils";
import { CREATOR_CAMPAIGN_STATUS_LABELS } from "@/db/label";
import { InviteCreatorForm } from "@/components/sponsors/invite-creator-form";
import { publicListUrl } from "@/lib/site";

type CampaignCreatorsProps = {
  campaignUuid: string;
  sponsor: string;
  canEdit: boolean;
};

/** The creators invited to a campaign, their answers and the lists that are the work; and, for an admin, the invitation form. */
export const CampaignCreators = async ({ campaignUuid, sponsor, canEdit }: CampaignCreatorsProps) => {
  const invitations = await listCampaignCreators(campaignUuid);

  return (
    <div className="flex flex-col gap-4">
      {invitations.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline-strong px-4 py-6 text-center text-sm text-muted">No creators invited.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline rounded-card border border-hairline">
          {invitations.map((invitation) => (
            <li key={invitation.uuid} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">
                  {invitation.creator.displayName}
                  {invitation.creator.username ? <span className="text-muted"> @{invitation.creator.username}</span> : null}
                </span>
                <Badge tone={invitation.status === "accepted" ? "success" : invitation.status === "declined" ? "neutral" : "warning"}>
                  {CREATOR_CAMPAIGN_STATUS_LABELS[invitation.status]}
                </Badge>
                <span className="text-xs text-muted">
                  Invited {formatDate(invitation.createdAt)}
                  {invitation.respondedAt ? ` · answered ${formatDate(invitation.respondedAt)}` : ""}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-secondary">{invitation.deliverables}</p>
              {invitation.list && (
                <a href={publicListUrl(invitation.list.slug)} target="_blank" rel="noreferrer" className="w-fit text-sm text-accent hover:text-accent-hover">
                  The work: {invitation.list.name}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && <InviteCreatorForm campaignUuid={campaignUuid} sponsor={sponsor} />}
    </div>
  );
};
