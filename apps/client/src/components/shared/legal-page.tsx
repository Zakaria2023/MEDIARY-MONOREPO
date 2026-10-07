import { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  /** The line under the title: what this page is and when it last changed. */
  intro: string;
  updated: string;
  children: ReactNode;
};

/** The frame for terms, privacy, support and credits: one column of readable prose. */
export const LegalPage = ({ title, intro, updated, children }: LegalPageProps) => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
    <header className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
      <p className="text-base text-muted">{intro}</p>
      <p className="text-xs text-faint">Last updated {updated}</p>
    </header>
    <div className="flex flex-col gap-6 text-sm leading-relaxed text-secondary [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-ink [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mt-1 [&_a]:text-accent">
      {children}
    </div>
  </main>
);
