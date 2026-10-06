import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { PageHeading } from "@/components/layout/page-heading";
import { MembersFilters } from "@/components/members/members-filters";
import { MembersList } from "@/components/members/members-list";
import { MembersListSkeleton } from "@/components/members/members-list-skeleton";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Members",
};

/**
 * Every member, newest first, searchable by handle, name or email. Roles
 * and suspensions are an admin's; a moderator sees the list read-only.
 */
const MembersPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const query = firstParam(params.q)?.trim() ?? "";
  const page = Number(firstParam(params.page)) || 1;
  // Gated by the dashboard layout; the cached lookup, for the role.
  const viewer = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Members"
        description="Everyone with an account, and who among them is staff."
      />
      <MembersFilters query={query} />
      <AsyncSection reloadKey={`${query}|${page}`} skeleton={<MembersListSkeleton />}>
        <MembersList query={query} page={page} canManage={viewer?.role === "admin"} viewerUuid={viewer?.uuid ?? ""} />
      </AsyncSection>
    </div>
  );
};

export default MembersPage;
