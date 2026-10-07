import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support-email";

const UPDATED = "7 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description: "The terms for using Mediary: your account, what you post, what Mediary provides, and how it ends.",
  path: "/terms",
});

/**
 * The terms, in plain words. Checked against the product on 7 October
 * 2026; still a draft until the owner has had it read for the places
 * Mediary is offered.
 */
const TermsPage = () => (
  <LegalPage title="Terms of use" intro="Plain words for what using Mediary means for you and for us." updated={UPDATED}>
    <section className="flex flex-col gap-2">
      <h2>Agreeing</h2>
      <p>
        By creating an account or using Mediary you agree to these terms and to the <Link href="/privacy">privacy policy</Link>. If you do not
        agree, do not use Mediary. Browsing the public site needs no account.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Your account</h2>
      <p>
        You must be at least 13, and old enough where you live to agree to this on your own. One person, one account, and the details you give
        must be yours. Keep your sign-in to yourself: what happens under your account is your responsibility. Your handle must not pretend to be
        someone else or a brand you do not speak for.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>What you post</h2>
      <p>
        Your reviews, notes, lists and profile stay yours. By posting them you give Mediary permission to store them, show them to the people
        your settings allow, and make the share images and previews the product makes from them, for as long as they are on Mediary. Other
        members may like, reply to and link to what they can see.
      </p>
      <p>Do not post:</p>
      <ul>
        <li>anything you do not have the right to share;</li>
        <li>harassment, hate, threats, or anyone&apos;s private information;</li>
        <li>spam, advertising, or links meant to mislead;</li>
        <li>spoilers in a review without marking it as containing spoilers.</li>
      </ul>
      <p>
        Anyone can report what breaks these rules. Staff may remove it, and may suspend an account that keeps breaking them. If you think a
        decision was wrong, write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Using it fairly</h2>
      <p>
        Do not scrape Mediary in bulk, overload it, get around its limits or privacy settings, or use it to collect other members&apos;
        information. Search engines and link previews are welcome.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>What Mediary provides</h2>
      <p>
        A place to keep your entertainment history and share it. The catalog comes from public sources named on the{" "}
        <Link href="/credits">credits page</Link>, and its titles, artwork and descriptions belong to their owners. Mediary does not host,
        stream or sell any of the works it lists, and a title&apos;s details may be incomplete or wrong.
      </p>
      <p>
        Mediary is free and is offered as it is, without a promise that it will always be available, keep every feature, or be free of
        mistakes. As far as the law allows, Mediary is not liable for losses from using it or from it being unavailable. Nothing here takes away
        rights the law where you live gives you and that cannot be signed away.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Your data</h2>
      <p>
        Download your library and diary whenever you like, and delete your account, which removes your profile and everything you tracked. The{" "}
        <Link href="/privacy">privacy policy</Link> says what Mediary keeps, why, and for how long.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Ending</h2>
      <p>
        You may leave at any time by deleting your account in your <Link href="/settings/account">account settings</Link>. Mediary may suspend or
        close an account that breaks these terms. If Mediary itself closes, members will be told in the app in time to download their data.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Changes</h2>
      <p>
        These terms may change. The date at the top says when they last did, and a change that matters will be announced in the app before it
        takes effect. Using Mediary after that means you accept the new terms.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Questions</h2>
      <p>
        Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or see the <Link href="/support">support page</Link>.
      </p>
    </section>
  </LegalPage>
);

export default TermsPage;
