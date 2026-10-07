import { Metadata } from "next";
import { AsyncSection } from "ui";
import { firstParam } from "validators";
import { AuditList } from "@/components/audit/audit-list";
import { AuditListSkeleton } from "@/components/audit/audit-list-skeleton";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Audit log",
};

/** Every staff action, newest first: who did what to what, and when. Read only. */
const AuditPage = async ({ searchParams }: Props) => {
  const page = Number(firstParam((await searchParams).page)) || 1;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading title="Audit log" description="What staff did, in order. Nothing here can be edited." />
      <AsyncSection reloadKey={`audit-${page}`} skeleton={<AuditListSkeleton />}>
        <AuditList page={page} />
      </AsyncSection>
    </div>
  );
};

export default AuditPage;
