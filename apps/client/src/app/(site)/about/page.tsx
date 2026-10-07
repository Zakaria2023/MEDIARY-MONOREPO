import { Metadata } from "next";
import { AsyncSection } from "ui";
import { AboutContact } from "@/components/about/about-contact";
import { AboutHero } from "@/components/about/about-hero";
import { AboutMosaic } from "@/components/about/about-mosaic";
import { AboutNumbers } from "@/components/about/about-numbers";
import { AboutNumbersSkeleton } from "@/components/about/about-numbers-skeleton";
import { AboutPrinciples } from "@/components/about/about-principles";
import { AboutStory } from "@/components/about/about-story";
import { LandingCta } from "@/components/landing/landing-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata } from "@/lib/seo";
import { aboutNode, graph } from "@/lib/structured-data";

const DESCRIPTION =
  "Why Mediary exists, what it believes, and how its catalog is built: one profile for everything you watch, play, read and hear.";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: DESCRIPTION,
  path: "/about",
});

/**
 * ABOUT MEDIARY: what it is, why it exists, the rules it is built by, the
 * catalog in live numbers, and where to write. An AboutPage in the
 * structured data, about the site's own Organization node.
 */
const AboutPage = () => (
  <main className="flex flex-1 flex-col">
    <JsonLd data={graph([aboutNode("/about", DESCRIPTION)])} />
    <AboutHero
      mosaic={
        <AsyncSection reloadKey="about-mosaic" skeleton={null}>
          <AboutMosaic />
        </AsyncSection>
      }
    />
    <AboutStory />
    <AboutPrinciples />
    <AsyncSection reloadKey="about-numbers" skeleton={<AboutNumbersSkeleton />}>
      <AboutNumbers />
    </AsyncSection>
    <AboutContact />
    <LandingCta heading="Come tell your story." body="Everything you love, finally in one place. Free, and yours to keep." />
  </main>
);

export default AboutPage;
