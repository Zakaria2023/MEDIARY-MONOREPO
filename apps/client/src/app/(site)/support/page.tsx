import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support-email";

const UPDATED = "7 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Support",
  description: "How to reach Mediary about your account, a title that is wrong, or something that should not be on the site.",
  path: "/support",
});

/** Where to turn, by question, with the one address for the rest. */
const SupportPage = () => (
  <LegalPage title="Support" intro="Most things have a page; the rest has an address." updated={UPDATED}>
    <section className="flex flex-col gap-2">
      <h2>Something on the site should not be there</h2>
      <p>
        Every review, reply, list and profile has a Report link. Reports go to staff, who can remove the thing or suspend the account; the
        person reported is never told who flagged them.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>A title is wrong or missing</h2>
      <p>
        The catalog comes from public sources named on the <Link href="/credits">credits page</Link>. Write with the address of the title and what is
        wrong, and it is corrected or re-synced from its source.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Your account</h2>
      <p>
        Sign-in, password and Google are on the <Link href="/settings/account">account page</Link>, with your data export and the way to
        delete the account. Who sees what is on the <Link href="/settings/privacy">privacy page</Link>.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Everything else</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Say which account it concerns, and nothing you would not want in an email.
      </p>
    </section>
  </LegalPage>
);

export default SupportPage;
