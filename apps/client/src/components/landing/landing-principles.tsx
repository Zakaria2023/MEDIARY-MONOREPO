import { Download, EyeOff, MailX, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";

const PRINCIPLES = [
  {
    icon: EyeOff,
    title: "Public, followers, or only you",
    body: "Your profile, library and activity each have their own setting, and any single title can override it.",
  },
  {
    icon: Download,
    title: "Take it with you",
    body: "Download your library and diary as files whenever you like. Delete your account and it is all gone.",
  },
  {
    icon: ShieldCheck,
    title: "No ads, nothing sold",
    body: "What you track is used to show you your own story, and never to profile you for anyone else.",
  },
  {
    icon: MailX,
    title: "No email you did not ask for",
    body: "Mediary sends no newsletters or digests. The only mail you get is a sign-in code when you ask for one.",
  },
];

/** YOURS, ON YOUR TERMS: the promises a tracker should make, each one true of the code. */
export const LandingPrinciples = () => (
  <section className="border-t border-hairline">
    <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[2fr_3fr] lg:gap-20">
      <div className="flex flex-col gap-6">
        <LandingSectionHeading
          align="start"
          eyebrow="Yours"
          title="A private library is a complete product."
          body="Social is there when you want it and never in the way. Everything is a setting, and everything is yours."
        />
        <Link href="/privacy" className="text-sm font-medium text-accent transition-colors hover:text-accent-hover">
          Read the privacy policy
        </Link>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-2">
        {PRINCIPLES.map((principle) => (
          <li key={principle.title} className="flex flex-col gap-3 bg-page p-6 sm:p-8">
            <principle.icon size={22} className="text-accent" />
            <span className="font-display text-lg font-semibold text-ink">{principle.title}</span>
            <span className="text-sm leading-relaxed text-muted">{principle.body}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
