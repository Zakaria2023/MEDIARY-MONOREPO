import { AsyncSection } from "ui";
import { TitleRailSkeleton } from "@/components/catalog/title-rail-skeleton";
import { CatalogProof } from "@/components/landing/catalog-proof";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingDiscover } from "@/components/landing/landing-discover";
import { LandingDiscoverSkeleton } from "@/components/landing/landing-discover-skeleton";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFeaturesSkeleton } from "@/components/landing/landing-features-skeleton";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingImports } from "@/components/landing/landing-imports";
import { LandingMedia } from "@/components/landing/landing-media";
import { LandingMediaSkeleton } from "@/components/landing/landing-media-skeleton";
import { LandingPrinciples } from "@/components/landing/landing-principles";
import { LandingRails } from "@/components/landing/landing-rails";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { PosterWall } from "@/components/landing/poster-wall";

/**
 * THE LANDING PAGE, what a visitor sees at the root. In reading order: the
 * promise over a wall of real posters, the eight media in their own words,
 * the product shown with real titles, moving in, the privacy promises, what
 * is trending now (the catalog a crawler follows), the questions, and the
 * invitation. The words of every section are in the first bytes; the parts
 * that read the catalog stream in behind their skeletons.
 */
export const Landing = () => (
  <main className="flex flex-1 flex-col pb-8">
    <LandingHero
      backdrop={
        <AsyncSection reloadKey="landing-wall" skeleton={null}>
          <PosterWall />
        </AsyncSection>
      }
      proof={
        <AsyncSection reloadKey="landing-proof" skeleton={<p className="h-5" />}>
          <CatalogProof />
        </AsyncSection>
      }
    />

    <AsyncSection reloadKey="landing-media" skeleton={<LandingMediaSkeleton />}>
      <LandingMedia />
    </AsyncSection>

    <AsyncSection reloadKey="landing-features" skeleton={<LandingFeaturesSkeleton />}>
      <LandingFeatures />
    </AsyncSection>

    <AsyncSection reloadKey="landing-discover" skeleton={<LandingDiscoverSkeleton />}>
      <LandingDiscover />
    </AsyncSection>

    <LandingImports />
    <LandingPrinciples />

    <section className="flex flex-col gap-12 border-t border-hairline py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <LandingSectionHeading
          align="start"
          eyebrow="Right now"
          title="What people are tracking."
          body="The catalog, live: what is trending in every medium this week, and the highest rated of all time."
        />
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <AsyncSection
          reloadKey="landing-rails"
          skeleton={
            <div className="flex flex-col gap-12">
              <TitleRailSkeleton />
              <TitleRailSkeleton />
            </div>
          }
        >
          <LandingRails />
        </AsyncSection>
      </div>
    </section>

    <LandingFaq />
    <LandingCta heading="Start your story." body="Free, private by your own rules, and ready in a minute. Your history is waiting." />
  </main>
);
