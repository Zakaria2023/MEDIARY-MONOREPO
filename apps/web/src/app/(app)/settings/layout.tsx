import { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteHeader } from "@/components/shared/site-header";

type Props = {
  children: ReactNode;
};

/**
 * The settings shell: a heading, the section list on the start edge, the
 * section's own form on the end edge. On a phone the list becomes a row of
 * tabs above the form.
 */
const SettingsLayout = ({ children }: Props) => (
  <>
    <SiteHeader />
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8">
      <SectionHeading
        size="page"
        title="Settings"
        description="Your account, your profile, and who sees what."
      />
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  </>
);

export default SettingsLayout;
