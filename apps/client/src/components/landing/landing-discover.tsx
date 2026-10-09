import { AudioLines, Sparkles } from "lucide-react";
import { AskDemo } from "@/components/landing/ask-demo";
import { LandingDiscoverCard } from "@/components/landing/landing-discover-card";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { ListenDemo } from "@/components/landing/listen-demo";
import { listCatalogShowcase } from "@/lib/server/catalog-cache";

const PICKS = 3;

/**
 * FINDING WHAT'S NEXT: the guide and Name that song, side by side, each
 * with a still drawn from the catalog's best scored titles. One query for
 * both stills. Both features are for members; the links lead through
 * sign-in.
 */
export const LandingDiscover = async () => {
  const top = await listCatalogShowcase({ sort: "top", perMedium: PICKS, withCover: true });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
      <div className="flex flex-col items-center gap-6">
        <span className="rounded-full border border-accent/30 bg-accent-tint px-3 py-1 text-xs font-medium text-accent">New</span>
        <LandingSectionHeading
          eyebrow="Find what's next"
          title="Not sure what to start? Ask."
          body="A guide that knows the whole catalog and your taste, and an ear for whatever is playing around you. Both land on real titles you can add in a tap."
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <LandingDiscoverCard
          className="lg:col-span-3"
          icon={<Sparkles size={20} />}
          title="Ask the guide"
          body="Say what you're in the mood for, in your own words. The guide searches every medium in Mediary, leaves out what you've already seen, and tells you why each pick fits."
          points={[
            "Knows what you loved from your library",
            "Anime, movies, shows, games, music, manga, comics and books",
            "Every pick opens in Mediary, ready to add",
          ]}
          href="/ask"
          action="Ask the guide"
          visual={<AskDemo picks={top.anime ?? []} />}
        />
        <LandingDiscoverCard
          className="lg:col-span-2"
          icon={<AudioLines size={20} />}
          title="Name that song"
          body="Hear something you love in a café or a film? Let Mediary listen for a few seconds, and it finds the song and the record it's on."
          points={["Eight seconds is enough", "Opens the album in Mediary", "Only listens when you tap"]}
          href="/listen"
          action="Try it"
          visual={<ListenDemo album={top.music?.[0] ?? null} />}
        />
      </div>
    </section>
  );
};
