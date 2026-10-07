import { Metadata } from "next";
import { listProviderAttributions } from "services";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";

const UPDATED = "7 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Credits",
  description: "The sources the Mediary catalog is built from, and the credit each asks for.",
  path: "/credits",
});

/**
 * THE ONE PAGE THAT NAMES THE SOURCES. Everywhere else, no vendor is named
 * on screen; here each source gets the credit its terms ask for, in the
 * words it asks for, read from the adapters so a changed requirement
 * changes this page without a rewrite.
 */
const CreditsPage = () => {
  const sources = listProviderAttributions();

  return (
    <LegalPage title="Credits" intro="Mediary keeps your history. The titles themselves come from these catalogs." updated={UPDATED}>
      <section className="flex flex-col gap-2">
        <h2>Catalog sources</h2>
        <ul>
          {sources.map((source) => (
            <li key={source.provider}>
              <a href={source.url} rel="noopener noreferrer" target="_blank">
                {source.name}
              </a>
              : {source.text}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2>Artwork</h2>
        <p>
          Posters, covers and backdrops are shown from each source&apos;s own image service and belong to their owners. Mediary stores their
          addresses, not the images, and shows them under each source&apos;s terms.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2>Fonts and icons</h2>
        <p>Sora, Manrope and JetBrains Mono under the SIL Open Font License; icons from Lucide under the ISC license.</p>
      </section>
    </LegalPage>
  );
};

export default CreditsPage;
