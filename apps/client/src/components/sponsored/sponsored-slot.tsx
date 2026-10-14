import { pickSponsoredPlacement } from "services";
import { SponsoredCard } from "@/components/sponsored/sponsored-card";
import { SponsorSurface } from "@/db/enum";

type SponsoredSlotProps = {
  surface: SponsorSurface;
  viewerUuid: string | null;
  /** The frame around the card on this screen: its width and gutter. */
  className?: string;
};

/**
 * ONE SPONSORED SLOT. The page asks for a slot on its screen, never for a
 * campaign; the service picks what is eligible for this viewer, or nothing,
 * and then nothing is drawn, not even a gap. Not cached: what is eligible
 * depends on who is looking and what they have already seen today.
 */
export const SponsoredSlot = async ({ surface, viewerUuid, className = "" }: SponsoredSlotProps) => {
  // A slot that fails to fill is an empty slot, never an error on the page.
  const placement = await pickSponsoredPlacement({ surface, viewerUuid }).catch(() => null);
  if (!placement) {
    return null;
  }

  return (
    <aside aria-label="Sponsored" className={className}>
      <SponsoredCard placement={placement} canReport={viewerUuid !== null} />
    </aside>
  );
};
