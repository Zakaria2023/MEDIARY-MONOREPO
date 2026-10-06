import { CircleCheck, CircleDashed } from "lucide-react";
import { ProviderStatus } from "services";
import { Badge } from "ui";
import { MEDIA_TYPE_PLURAL_LABELS } from "@/db/label";

type ProviderStatusCardProps = {
  status: ProviderStatus;
};

/**
 * One catalog source: what it supplies and whether it can be used. A source
 * without credentials names the variables it is waiting for, so the fix is
 * on the screen rather than in a doc.
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
        Add{" "}
        {status.envVars.map((name, index) => (
          <span key={name}>
            {index > 0 && " and "}
            <code className="font-mono text-secondary">{name}</code>
          </span>
        ))}{" "}
        to the environment, then restart the app.
      </p>
    )}
  </div>
);
