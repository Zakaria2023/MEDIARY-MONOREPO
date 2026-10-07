import { Plus } from "lucide-react";
import { LandingSectionHeading } from "@/components/landing/landing-section-heading";
import { LANDING_FAQ } from "@/lib/landing-faq";

/**
 * THE QUESTIONS, as native disclosure rows: open and close without any
 * script, readable by a crawler closed or open. The same list goes out as
 * FAQPage structured data from the page.
 */
export const LandingFaq = () => (
  <section className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-5 py-24 sm:px-8 sm:py-32">
    <LandingSectionHeading eyebrow="Questions" title="Good to know." body="The short answers. The rest is on the support page." />
    <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
      {LANDING_FAQ.map((item) => (
        <details key={item.question} className="group py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left font-display text-lg text-ink transition-colors hover:text-accent sm:text-xl [&::-webkit-details-marker]:hidden">
            {item.question}
            <Plus size={20} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45" />
          </summary>
          <p className="max-w-3xl pb-5 text-base leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  </section>
);
