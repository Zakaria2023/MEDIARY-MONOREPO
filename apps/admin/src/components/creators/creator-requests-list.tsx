import { BadgeCheck } from "lucide-react";
import { listCreatorRequests } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { CreatorStatus } from "@/db/enum";
import { CreatorRequestRow } from "@/components/creators/creator-request-row";

type CreatorRequestsListProps = {
  status: CreatorStatus;
  page: number;
  canRevoke: boolean;
};

/** What the empty state says for each tab. */
const EMPTY: Record<CreatorStatus, string> = {
  pending: "No requests waiting.",
  verified: "No verified creators yet.",
  rejected: "No refused requests.",
  revoked: "No badges taken away.",
};

/** The requests or creators in one status, the oldest request first. */
export const CreatorRequestsList = async ({ status, page, canRevoke }: CreatorRequestsListProps) => {
  const result = await listCreatorRequests({ status, page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <BadgeCheck size={22} className="text-faint" />
        <p className="text-sm text-muted">{EMPTY[status]}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-3">
        {result.items.map((request) => (
          <CreatorRequestRow key={request.uuid} request={request} canRevoke={canRevoke} />
        ))}
      </ul>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(target) => filterHref("/creators", { status, page: target })} />
    </div>
  );
};
