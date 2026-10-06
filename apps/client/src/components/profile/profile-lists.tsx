import Link from "next/link";
import { listProfileLists, PublicProfile } from "services";
import { ListGrid } from "@/components/lists/list-grid";
import { SectionHeading } from "@/components/shared/section-heading";

type ProfileListsProps = {
  profile: PublicProfile;
};

/** The lists the viewer may see on this profile. None visible, nothing shown. */
export const ProfileLists = async ({ profile }: ProfileListsProps) => {
  const lists = await listProfileLists(profile.uuid, profile.relation);
  if (lists.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading
        title="Lists"
        action={
          profile.relation === "owner" ? (
            <Link href="/lists" className="text-sm text-muted transition-colors hover:text-ink">
              Manage your lists
            </Link>
          ) : undefined
        }
      />
      <ListGrid lists={lists} />
    </section>
  );
};
