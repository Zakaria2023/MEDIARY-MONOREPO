import { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/shared/legal-page";
import { pageMetadata } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support-email";

const UPDATED = "9 October 2026";

export const metadata: Metadata = pageMetadata({
  title: "Community guidelines",
  description:
    "How to be a good neighbour on Mediary: reviews, replies, lists and profiles, spoilers, what to report, and what staff do about it.",
  path: "/guidelines",
});

/**
 * THE HOUSE RULES, in plain words: what the terms forbid, said as how to
 * behave, with what a report does and what staff can do, each matched to
 * what the product actually offers (the report reasons, block and mute,
 * removal and suspension). Checked against the code on 9 October 2026.
 */
const GuidelinesPage = () => (
  <LegalPage
    title="Community guidelines"
    intro="Mediary is a place to keep your history and talk about what you love. These are the few rules that keep it pleasant."
    updated={UPDATED}
  >
    <section className="flex flex-col gap-2">
      <h2>Talk about the work</h2>
      <p>
        Disagree as much as you like about a film, a game or an album. Argue with the take, never with the person: no insults, threats,
        harassment or hate aimed at anyone, on Mediary or about someone off it. A reply is a conversation, not a pile-on.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Mark your spoilers</h2>
      <p>
        If a review gives away something a newcomer would want to find out for themselves, tick &ldquo;Contains spoilers&rdquo; when you write
        it. Its headline and text then wait behind a click for everyone who hides spoilers. Keep spoilers out of headlines, list names and
        replies, which are not hidden.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>Be yourself, once</h2>
      <p>
        One account per person. Your handle and profile must not pretend to be someone else, or a studio, publisher or brand you do not speak
        for. Do not post anyone&apos;s private information, yours included, in a review, a list or a reply.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>No spam</h2>
      <p>
        No advertising, links meant to mislead, copied reviews posted again and again, or lists made only to promote something. Reviews are for
        what you watched, played, read or heard.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2>When something is wrong</h2>
      <ul>
        <li>
          <strong>Report it.</strong> Every review, reply, list and profile has a report button. Pick the reason (spam or advertising,
          harassment or hate, unmarked spoilers, or something else) and add a line if it helps. The person you report is not told who reported
          them.
        </li>
        <li>
          <strong>Block or mute.</strong> A block hides the two of you from each other everywhere and ends any follow between you. A mute
          quietly takes someone out of your feed without telling them. Both are undone on your privacy settings.
        </li>
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <h2>What staff do</h2>
      <p>
        Staff read every report. A report that does not break these rules is dismissed. One that does gets the thing removed: a review or a
        reply is deleted, a list is deleted, and an account that keeps breaking the rules, or breaks them badly, is suspended. Every decision is
        recorded with who made it.
      </p>
      <p>
        If you think a decision about you was wrong, write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and say which one. These
        guidelines sit beside the <Link href="/terms">terms of use</Link>, which have the final word.
      </p>
    </section>
  </LegalPage>
);

export default GuidelinesPage;
