import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support-email";

const UPDATED = "8 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "What Mediary keeps about you, why, who can see it, how long it stays, and how you take it with you or delete it.",
  path: "/privacy",
});

/**
 * The privacy policy, in plain words. Every line was checked against what
 * the code does on 7 October 2026; a change to what is stored, shared or
 * kept changes this page in the same commit. Still a draft until the owner
 * has had it read for the places Mediary is offered.
 */
const PrivacyPage = () => (
  <LegalPage title="Privacy policy" intro="What Mediary keeps, why, who sees it, and what you control." updated={UPDATED}>
    <section className="flex flex-col gap-2">
      <h2>What Mediary keeps</h2>
      <ul>
        <li>
          <strong>Your account.</strong> The email you sign in with, and, if you sign in with Google, the name and picture that account
          shares. Sign-in, passwords and sessions are run by an identity service on Mediary&apos;s behalf. Mediary does not store your password.
          When you change it, it passes through Mediary&apos;s server to that service and is not kept.
        </li>
        <li>
          <strong>Your profile.</strong> Your handle, display name, bio, location, links, taste statement, time zone and settings. Your
          picture is the one your sign-in account provides.
        </li>
        <li>
          <strong>What you track.</strong> Every title you add with its status, score, progress, dates, platform, playthroughs, notes and
          favorite mark; the diary built from each change; your reviews, lists, follows, likes and replies; the people you block or mute; and
          the notifications others&apos; actions create for you.
        </li>
        <li>
          <strong>Imports.</strong> When you import a list from another site, Mediary reads the file and keeps its lines (titles, years,
          scores, progress and dates) so you can review the matches. The file itself is not kept.
        </li>
        <li>
          <strong>Reports.</strong> When you report something, Mediary keeps the report, who it was about, and a short excerpt of the thing
          reported, so staff can decide on it.
        </li>
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Why</h2>
      <p>
        To show you your own history, stats and recommendations; to show other members what your settings let them see; and to keep the
        service safe, working and free of abuse. Mediary does not sell your data, does not show advertising, and does not use what you track to
        profile you for anyone else.
      </p>
      <p>
        Mediary sends you no email of its own. The only mail you get is the sign-in and verification codes the identity service sends when
        you ask for them.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Who can see what</h2>
      <p>
        Your profile, your library and your activity each have their own setting: public, followers only, or only you. Every title in your
        library can override the library&apos;s setting, every list and review has its own, and you decide who may compare tastes with you. A
        public profile, a public list, a public review on a title&apos;s page and the share images made from them can be found by search
        engines. A blocked account sees nothing of yours. Change any of it in your <Link href="/settings/privacy">privacy settings</Link>.
      </p>
      <p>Staff can see what they need to answer a report or keep the service running, and nothing they see is shown to anyone else.</p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Cookies and your browser</h2>
      <ul>
        <li>The identity service sets the cookies that keep you signed in. Without them, sign-in does not work.</li>
        <li>Two Mediary cookies remember your theme and your reduced-motion choice, so the page draws correctly before it loads.</li>
        <li>Your recent searches are kept in your own browser only, never sent to Mediary.</li>
      </ul>
      <p>Mediary uses no advertising or tracking cookies.</p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>The guide and Name that song</h2>
      <ul>
        <li>
          <strong>The guide.</strong> When you ask the guide for a recommendation, what you write in that conversation, together with the
          titles you loved or finished, your scores for them and the genres you lean toward, is sent to an AI service that writes the
          answer. Mediary does not keep the conversation: it lives on the page and is gone when you leave or start over. The service handles
          it only to answer you, under its own terms for business customers, and does not use it to train its models.
        </li>
        <li>
          <strong>Name that song.</strong> When you press listen, your microphone records about eight seconds, and only then. The recording is
          sent to a song recognition service to find the song, and Mediary does not keep it. Your browser asks before Mediary can use the
          microphone at all.
        </li>
      </ul>
      <p>Neither is used unless you open it, and Mediary counts how often you use each in a day only to keep the cost in check.</p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Who runs it</h2>
      <p>
        Mediary runs on a hosting provider, a database provider and the identity service above, with the AI service and the song
        recognition service for the guide and Name that song. Each handles your data only to run Mediary. Your address and the time of each request reach the hosting provider&apos;s logs, as
        on any website. Mediary uses your address for about a minute to stop runaway requests, and does not keep it. The catalog&apos;s
        titles and artwork come from the sources on the <Link href="/credits">credits page</Link>. That information is not about you, and those
        sources are not sent anything about you, with one exception: when you press &ldquo;Look further&rdquo; on the search page, the
        words you searched for are sent to them from Mediary&apos;s server, without your name or account. A title you bring in joins the
        catalog for everyone, and Mediary does not record who brought it.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>How long, and your rights</h2>
      <p>
        Everything stays until you change or delete it. Download your library and diary as files from your{" "}
        <Link href="/settings/account">account settings</Link> whenever you like. Deleting your account there removes your sign-in, your
        profile, everything you tracked, your reviews, lists, follows, likes, replies, imports and the reports you made, at once.
      </p>
      <p>
        Two things outlive it on purpose. A report someone else made about something you posted keeps its excerpt so the decision on it can be
        checked. The record of what staff did keeps the action but nothing that names you. The hosting provider&apos;s logs expire on
        their own schedule.
      </p>
      <p>
        You can ask what Mediary holds about you, ask for a correction, or object to how it is used by writing to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Children</h2>
      <p>
        Mediary is not for anyone under 13, or under the age your country sets for agreeing to this on your own. An account found to belong
        to someone younger is closed and its data deleted.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Changes</h2>
      <p>
        When this policy changes, the date at the top changes with it. A change that uses your data in a new way will be announced in the app
        before it takes effect.
      </p>
    </section>
  </LegalPage>
);

export default PrivacyPage;
