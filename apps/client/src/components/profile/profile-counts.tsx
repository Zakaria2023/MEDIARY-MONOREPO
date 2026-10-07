import Link from "next/link";
import { getProfileCounts, PublicProfile } from "services";
import { formatCount } from "utils";
import { JsonLd } from "@/components/seo/json-ld";
import { profileLibraryPath } from "@/lib/profile-path";
import { graph, profileNodes } from "@/lib/structured-data";

type ProfileCountsProps = {
  profile: PublicProfile;
};

type CountItem = {
  label: string;
  value: string;
  href: string | null;
};

/** The numbers under a profile's name, and the page's JSON-LD, which carries one of them. Titles and Completed open those cards. */
export const ProfileCounts = async ({ profile }: ProfileCountsProps) => {
  const counts = await getProfileCounts(profile.uuid);
  const library = profile.access.library;
  const items: CountItem[] = [
    { label: "Titles", value: formatCount(counts.titles), href: library ? profileLibraryPath(profile.username, undefined) : null },
    { label: "Completed", value: formatCount(counts.completed), href: library ? profileLibraryPath(profile.username, undefined, "completed") : null },
    { label: "Hours", value: formatCount(counts.hours), href: null },
    { label: "Followers", value: formatCount(counts.followers), href: null },
    { label: "Following", value: formatCount(counts.following), href: null },
  ];

  return (
    <>
      <JsonLd data={graph(profileNodes(profile, counts))} />
      <dl className="flex flex-wrap gap-6">
        {items.map((item) => {
          const body = (
            <>
              <dd className="tabular font-display text-lg font-semibold text-ink">{item.value}</dd>
              <dt className="text-sm text-muted">{item.label}</dt>
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className="group flex items-baseline gap-1.5 rounded-control transition-colors hover:text-accent">
              {body}
            </Link>
          ) : (
            <div key={item.label} className="flex items-baseline gap-1.5">
              {body}
            </div>
          );
        })}
      </dl>
    </>
  );
};
