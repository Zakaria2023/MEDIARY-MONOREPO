import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";

const UPDATED = "7 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Terms of use",
  description: "The terms for using Mediary: your account, what you post, what Mediary provides, and how it ends.",
  path: "/terms",
});

/** The terms, in plain words. A draft for the owner to have reviewed before launch. */
const TermsPage = () => (
  <LegalPage title="Terms of use" intro="Plain words for what using Mediary means for you and for us." updated={UPDATED}>
    <section className="flex flex-col gap-2">
      <h2>Your account</h2>
      <p>
        You need an account to track, review and follow. Keep your sign-in to yourself; what happens under your account is yours.
        One person, one account. You must be old enough to agree to these terms where you live.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>What you post</h2>
      <p>
        Reviews, notes, lists and your profile are yours. By posting them you let Mediary show them to the people your settings allow,
        and let other members like, reply to and share them as the product does. Do not post what you do not have the right to, what harasses
        anyone, spam, or spoilers you have not marked. Staff may remove what breaks these rules and may suspend an account that keeps breaking them.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>What Mediary provides</h2>
      <p>
        A place to keep your entertainment history and share it. The catalog comes from public sources named on the{" "}
        <Link href="/credits">credits page</Link>; Mediary does not host, stream or sell any of the works it lists. Mediary is offered as it is,
        without a promise that it is always available or free of mistakes, and may change or end features.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Your data</h2>
      <p>
        You can export your library and diary at any time and delete your account, which removes your profile and everything you tracked. The{" "}
        <Link href="/privacy">privacy policy</Link> says what Mediary keeps and why.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Ending</h2>
      <p>
        You may leave at any time by deleting your account. Mediary may suspend or close an account that breaks these terms. These terms may change;
        the date at the top says when they last did.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Questions</h2>
      <p>
        Write through the <Link href="/support">support page</Link>.
      </p>
    </section>
  </LegalPage>
);

export default TermsPage;
