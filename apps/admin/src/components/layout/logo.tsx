import Image from "next/image";

type LogoProps = {
  /** The wordmark beside the mark. Off in the collapsed sidebar. */
  wordmark?: boolean;
};

/**
 * The brand mark from the logo file, with an "Admin" tag so a staff member
 * with both apps open can tell the tabs apart at a glance. The lockup PNG
 * is the brand file itself; the mark is cropped from it.
 */
export const Logo = ({ wordmark = true }: LogoProps) => (
  <span className="inline-flex items-center gap-2.5">
    <Image
      src="/brand/mediary-mark.png"
      alt="Mediary"
      width={32}
      height={32}
      priority
    />
    {wordmark && (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          Mediary
        </span>
        <span className="rounded-full border border-hairline-strong px-1.5 py-px text-xs font-medium uppercase tracking-wide text-muted">
          Admin
        </span>
      </span>
    )}
  </span>
);
