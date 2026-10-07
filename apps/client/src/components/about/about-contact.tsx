import { ArrowUpRight, LifeBuoy, Mail, Scale } from "lucide-react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/support-email";

const LINKS = [
  { icon: LifeBuoy, label: "Support", body: "Your account, a wrong title, or something to report.", href: "/support" },
  { icon: Scale, label: "Terms and privacy", body: "Plain words for what using Mediary means.", href: "/privacy" },
];

/** WHERE TO TURN: the one address, and the pages that answer the rest. */
export const AboutContact = () => (
  <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-24 sm:px-8 sm:pb-32 lg:grid-cols-3">
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="group flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors hover:border-hairline-strong sm:p-8"
    >
      <Mail size={22} className="text-accent" />
      <span className="font-display text-xl font-semibold text-ink">Write to us</span>
      <span className="text-sm text-muted">{SUPPORT_EMAIL}</span>
    </a>
    {LINKS.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="group flex flex-col gap-4 rounded-card border border-hairline bg-surface p-6 transition-colors hover:border-hairline-strong sm:p-8"
      >
        <span className="flex items-center justify-between">
          <link.icon size={22} className="text-accent" />
          <ArrowUpRight size={18} className="text-faint transition-colors group-hover:text-ink" />
        </span>
        <span className="font-display text-xl font-semibold text-ink">{link.label}</span>
        <span className="text-sm text-muted">{link.body}</span>
      </Link>
    ))}
  </section>
);
