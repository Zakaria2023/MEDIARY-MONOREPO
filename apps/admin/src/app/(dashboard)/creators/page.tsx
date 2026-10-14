import { Metadata } from "next";
import Link from "next/link";
import { AsyncSection, Skeleton } from "ui";
import { filterHref } from "utils";
import { firstParam } from "validators";
import { CreatorStatus, creatorStatuses } from "@/db/enum";
import { CREATOR_STATUS_LABELS } from "@/db/label";
import { CreatorRequestsList } from "@/components/creators/creator-requests-list";
import { PageHeading } from "@/components/layout/page-heading";
import { getCurrentUser } from "@/lib/auth";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Creators",
};

const parseStatus = (value: string | undefined): CreatorStatus => creatorStatuses.find((status) => status === value) ?? "pending";

/**
 * CREATOR VERIFICATION: requests waiting, and creators by where they stand.
 * Staff look for the member's code on their channels, then verify or
 * refuse; an admin may take a badge away. Nobody pays for any of it.
 */
const CreatorsPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const status = parseStatus(firstParam(params.status));
  const page = Number(firstParam(params.page)) || 1;
  const viewer = await getCurrentUser();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        title="Creators"
        description="Members who asked for the verified creator badge. Verification says who someone is; it is never sold."
      />
      <nav aria-label="Creator status" className="flex flex-wrap gap-2">
        {creatorStatuses.map((value) => (
          <Link
            key={value}
            href={filterHref("/creators", { status: value === "pending" ? undefined : value })}
            aria-current={value === status ? "page" : undefined}
            className={`flex h-8 items-center rounded-full px-3 text-sm transition-colors ${
              value === status ? "bg-surface-2 text-ink" : "border border-hairline text-secondary hover:text-ink"
            }`}
          >
            {CREATOR_STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>
      <AsyncSection reloadKey={`creators-${status}-${page}`} skeleton={<Skeleton className="h-64 rounded-card" />}>
        <CreatorRequestsList status={status} page={page} canRevoke={viewer?.role === "admin"} />
      </AsyncSection>
    </div>
  );
};

export default CreatorsPage;
