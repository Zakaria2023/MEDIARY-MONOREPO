import { CircleCheck, CircleDashed } from "lucide-react";
import { ProviderStatus } from "services";
import { Badge } from "ui";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

type ProviderStatusCardProps = {
  status: ProviderStatus;
};

/**
 * One catalog source: what it supplies and whether it can be used. Named by
 * what it is, never by the vendor, and never with a credential's name.
 */
export const ProviderStatusCard = ({ status }: ProviderStatusCardProps) => (
  <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    <div className="flex items-center justify-between gap-3">
      <span className="font-display text-lg text-ink">{status.name}</span>
      {status.configured ? (
        <Badge tone="success" icon={<CircleCheck size={12} />}>
          Ready
        </Badge>
      ) : (
        <Badge tone="warning" icon={<CircleDashed size={12} />}>
          Not configured
        </Badge>
      )}
    </div>
    <p className="text-sm text-muted">
      {status.mediaTypes.map((type) => MEDIA_TYPE_PLURAL_LABELS[type]).join(" and ")}
    </p>
    {!status.configured && (
      <p className="text-xs leading-relaxed text-faint">
        Its access keys are not set on the server yet. Ask whoever runs the deployment to add
        them, then restart the app.
      </p>
    )}
  </div>
);
