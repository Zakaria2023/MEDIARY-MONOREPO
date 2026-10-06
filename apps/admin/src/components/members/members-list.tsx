import { SearchX } from "lucide-react";
import { listMembers } from "services";
import { Pagination } from "ui";
import { filterHref } from "utils";
import { MemberRow } from "@/components/members/member-row";

type MembersListProps = {
  query: string;
  page: number;
  /** Whether the viewer is an admin and may change roles and status. */
  canManage: boolean;
  viewerUuid: string;
};

/** The async half of the members screen: one page of rows, or why there are none. */
export const MembersList = async ({ query, page, canManage, viewerUuid }: MembersListProps) => {
  const result = await listMembers({ query, page });

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline-strong px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline text-faint">
          <SearchX size={22} />
        </span>
        <p className="font-display text-lg text-ink">Nobody matches</p>
        <p className="max-w-sm text-sm text-muted">No member has a handle, name or email like that.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="tabular text-sm text-muted">
        {result.total.toLocaleString("en-US")} {result.total === 1 ? "member" : "members"}
      </p>
      <ul className="flex flex-col gap-2">
        {result.items.map((member) => (
          <MemberRow key={member.uuid} member={member} canManage={canManage && member.uuid !== viewerUuid} />
        ))}
      </ul>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(target) => filterHref("/members", { q: query, page: target })}
      />
    </div>
  );
};
