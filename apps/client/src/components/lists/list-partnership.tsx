import { Handshake } from "lucide-react";
import { ListPartnership as ListPartnershipData } from "services";

type ListPartnershipProps = {
  partnership: ListPartnershipData;
};

/**
 * THE DISCLOSURE ON A CREATOR'S PAID WORK, on the work itself and above it:
 * whose partnership this list is, in the words the campaign set. It is not
 * a tooltip or a footnote, and it is not only on the profile.
 */
export const ListPartnership = ({ partnership }: ListPartnershipProps) => (
  <aside
    aria-label="Paid partnership"
    className="flex items-start gap-3 rounded-card border border-hairline bg-surface px-4 py-3 text-sm"
  >
    <Handshake size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden />
    <div className="flex flex-col gap-0.5">
      <p className="font-medium text-ink">Paid partnership with {partnership.sponsor}</p>
      <p className="text-secondary">{partnership.disclosure}</p>
    </div>
  </aside>
);
