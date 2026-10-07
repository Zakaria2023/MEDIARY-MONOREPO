import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";

const UPDATED = "7 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "What Mediary keeps about you, why, who can see it, and how you take it with you or delete it.",
  path: "/privacy",
});

/** The privacy policy, in plain words. A draft for the owner to have reviewed before launch. */
const PrivacyPage = () => (
  <LegalPage title="Privacy policy" intro="What Mediary keeps, why, and what you control." updated={UPDATED}>
    <section className="flex flex-col gap-2">
      <h2>What Mediary keeps</h2>
      <ul>
        <li>Your account: the email you sign in with and, if you use it, your Google account&apos;s name and picture. Sign-in itself is handled by an identity service; Mediary never sees your password.</li>
        <li>Your profile: the handle, display name, bio, links and settings you enter.</li>
        <li>What you track: every title, status, score, progress, date, note, favorite, review, list, follow, like and reply you make, and the diary built from them.</li>
        <li>Technical records: when your account was created and changed, and the usual server logs for keeping the site working.</li>
      </ul>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Why</h2>
      <p>
        To show you your own history, your stats and your recommendations; to show other members what your settings let them see; and to keep the
        service safe and working. Mediary sends you no email of its own; the only mail you get is the identity service&apos;s sign-in codes.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Who can see what</h2>
      <p>
        Your profile, your library and your activity each have a visibility: everyone, people who follow you, or only you. Every entry can
        override the library&apos;s default. A blocked account sees nothing of yours. Public profiles and public lists may be found through search
        engines. Change any of this at any time in your <Link href="/settings/privacy">privacy settings</Link>.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Your rights</h2>
      <p>
        Export your library and diary from your <Link href="/settings/account">account settings</Link>, and delete your account there, which
        removes your profile and everything you tracked. Reports you made about others, and records staff kept, outlive the things they were about.
      </p>
    </section>
    <section className="flex flex-col gap-2">
      <h2>Where it is kept</h2>
      <p>
        On servers run by the hosting and database providers Mediary uses, under their own security. The catalog&apos;s titles and artwork come
        from the sources on the <Link href="/credits">credits page</Link> and are not about you.
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

export default PrivacyPage;
