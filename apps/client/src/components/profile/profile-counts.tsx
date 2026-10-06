import { getProfileCounts, PublicProfile } from "services";
import { formatCount } from "utils";
import { JsonLd } from "@/components/seo/json-ld";
import { graph, profileNodes } from "@/lib/structured-data";

type ProfileCountsProps = {
  profile: PublicProfile;
};

/** The three numbers under a profile's name, and the page's JSON-LD, which carries one of them. */
export const ProfileCounts = async ({ profile }: ProfileCountsProps) => {
  const counts = await getProfileCounts(profile.uuid);
  const items: [string, string][] = [
    ["Titles", formatCount(counts.titles)],
    ["Completed", formatCount(counts.completed)],
    ["Hours", formatCount(counts.hours)],
    ["Followers", formatCount(counts.followers)],
    ["Following", formatCount(counts.following)],
  ];

  return (
    <>
      <JsonLd data={graph(profileNodes(profile, counts))} />
      <dl className="flex flex-wrap gap-6">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dd className="tabular font-display text-lg font-semibold text-ink">{value}</dd>
            <dt className="text-sm text-muted">{label}</dt>
          </div>
        ))}
      </dl>
    </>
  );
};
