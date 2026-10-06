import Image from "next/image";

type LogoProps = {
  /** The wordmark beside the mark. Off on the tightest layouts. */
  wordmark?: boolean;
  /** Rendered height in pixels; the width follows the file's proportions. */
  height?: number;
};

/** The brand file's proportions, so the width never has to be guessed. */
const LOCKUP_RATIO = 1985 / 464;

/**
 * THE LOGO, from the brand file in public/brand: the stacked-panels play
 * mark with the gradient wordmark. The PNG carries the spectrum itself, so
 * the component paints nothing; the gradient utilities stay for the four
 * surfaces that are allowed them.
 */
export const Logo = ({ wordmark = true, height = 28 }: LogoProps) =>
  wordmark ? (
    <Image
      src="/brand/mediary-logo.png"
      alt="Mediary"
      width={Math.round(height * LOCKUP_RATIO)}
      height={height}
      priority
    />
  ) : (
    <Image
      src="/brand/mediary-mark.png"
      alt="Mediary"
      width={height}
      height={height}
      priority
    />
  );
