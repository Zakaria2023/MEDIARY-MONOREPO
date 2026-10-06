import { getTasteTraits, PublicProfile } from "services";
import { TasteDna } from "@/components/profile/taste-dna";
import { SectionHeading } from "@/components/shared/section-heading";

type ProfileTasteProps = {
  profile: PublicProfile;
};

/** The owner's Taste DNA, from their library. Nothing with genres yet, nothing drawn. */
export const ProfileTaste = async ({ profile }: ProfileTasteProps) => {
  const traits = await getTasteTraits(profile.uuid);
  if (traits.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <SectionHeading title="Taste DNA" description="The genres this library leans on, from scores and completions." />
      <TasteDna traits={traits.map((trait) => ({ label: trait.name, value: trait.value }))} />
      {profile.tasteStatement && <p className="text-sm text-secondary">{profile.tasteStatement}</p>}
    </section>
  );
};
