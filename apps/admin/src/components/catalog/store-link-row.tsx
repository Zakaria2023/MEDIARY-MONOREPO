"use client";

import { Eye, EyeOff, Undo2 } from "lucide-react";
import { AdminStoreLink } from "services";
import { isBrokenStatus } from "services/pure";
import { Badge, Button, FormError } from "ui";
import { formatDate } from "utils";
import { STORE_LABELS, STORE_LINK_KIND_LABELS } from "@/db/label";
import { useStoreLinkRow } from "@/app/(dashboard)/catalog/[uuid]/use-store-link-row";

type StoreLinkRowProps = {
  mediaUuid: string;
  link: AdminStoreLink;
  /** Only an admin changes commercial links. */
  canEdit: boolean;
};

/** One store on a title: where it came from, whether it shows, how its last check went, and the controls. */
export const StoreLinkRow = ({ mediaUuid, link, canEdit }: StoreLinkRowProps) => {
  const { error, isPending, onToggleHidden, onRemove } = useStoreLinkRow(mediaUuid, link.store);
  const broken = isBrokenStatus(link.lastCheckStatus);

  return (
    <li className={`flex flex-col gap-2 rounded-card border border-hairline px-4 py-3 ${link.hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">{STORE_LABELS[link.store]}</span>
        <Badge>{STORE_LINK_KIND_LABELS[link.kind]}</Badge>
        <Badge tone={link.automatic && !link.held ? "neutral" : "violet"}>
          {link.automatic ? (link.held ? "Automatic, changed by staff" : "Automatic") : "Added by staff"}
        </Badge>
        {link.hidden && <Badge tone="warning">Hidden</Badge>}
        {broken && <Badge tone="danger">Looks broken</Badge>}
      </div>
      <a href={link.url} target="_blank" rel="noreferrer" className="line-clamp-1 break-all font-mono text-xs text-muted hover:text-ink">
        {link.url}
      </a>
      {link.lastCheckedAt && (
        <p className="text-xs text-muted">
          Checked {formatDate(link.lastCheckedAt)}: {link.lastCheckStatus === 0 ? "no answer" : `status ${link.lastCheckStatus}`}
        </p>
      )}
      <FormError message={error ?? undefined} />
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => onToggleHidden(!link.hidden)} disabled={isPending}>
            {link.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            {link.hidden ? "Show it" : "Hide it"}
          </Button>
          {link.held && (
            <Button variant="ghost" size="sm" onClick={onRemove} disabled={isPending}>
              <Undo2 size={14} />
              {link.automatic ? "Back to automatic" : "Remove"}
            </Button>
          )}
        </div>
      )}
    </li>
  );
};
