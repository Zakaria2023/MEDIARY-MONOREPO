import { getLibraryCountsFor, listLibraryFor, PublicProfile } from "services";
import { Pagination } from "ui";
import { LaunchMediaType, TrackingStatus } from "@/db/enum";
import { MEDIA_TYPE_PLURAL_LABELS, TRACKING_STATUS_LABELS } from "@/db/label";
import { CatalogEmptyState } from "@/components/catalog/catalog-empty-state";
import { GRID_CLASSES } from "@/components/catalog/title-grid";
import { LibraryCard } from "@/components/library/library-card";
import { ProfileEntryCard } from "@/components/profile/profile-entry-card";
import { ProfileLibraryTabs } from "@/components/profile/profile-library-tabs";
import { profileLibraryPath } from "@/lib/profile-path";

type ProfileLibraryProps = {
  profile: PublicProfile;
  mediaType: LaunchMediaType | undefined;
  status: TrackingStatus | undefined;
  page: number;
};

/**
 * SOMEONE'S TITLES AS CARDS, one medium or all, one status or all, as the
 * viewer may see them: the service applies each entry's visibility and
 * the library's default. The owner's cards open the sheet; a visitor's
 * open the title.
 */
export const ProfileLibrary = async ({ profile, mediaType, status, page }: ProfileLibraryProps) => {
  const viewer = { ownerUuid: profile.uuid, relation: profile.relation };
  const [counts, result] = await Promise.all([
    getLibraryCountsFor(viewer, mediaType),
    listLibraryFor(viewer, { mediaType, status, page }),
  ]);
  const owner = profile.relation === "owner";
  const noun = mediaType ? MEDIA_TYPE_PLURAL_LABELS[mediaType].toLowerCase() : "titles";
  const word = status && mediaType ? TRACKING_STATUS_LABELS[mediaType][status].toLowerCase() : null;

  return (
    <div className="flex flex-col gap-6">
      <ProfileLibraryTabs username={profile.username} counts={counts} mediaType={mediaType} status={status} />
      {result.total === 0 ? (
        <CatalogEmptyState
          heading={status ? `Nothing ${word ?? "with this status"} yet` : `No ${noun} yet`}
          body={
            owner
              ? "Open any title and press Track it. Everything you add shows up here."
              : `${profile.displayName} has nothing here that you can see.`
          }
          action={
            status
              ? { label: `All ${noun}`, href: profileLibraryPath(profile.username, mediaType) }
              : { label: "Explore the catalog", href: "/explore" }
          }
        />
      ) : (
        <>
          <div className={GRID_CLASSES}>
            {result.items.map((item) =>
              owner ? <LibraryCard key={item.entry.uuid} item={item} /> : <ProfileEntryCard key={item.entry.uuid} item={item} />,
            )}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            hrefFor={(target) => profileLibraryPath(profile.username, mediaType, status, target)}
          />
        </>
      )}
    </div>
  );
};
