"use client";

import { InvoiceRow as InvoiceRowData } from "services";
import { NEXT_INVOICE_STATUSES } from "services/pure";
import { Badge, Button, FormError } from "ui";
import { formatDate, formatMoney } from "utils";
import { InvoiceStatus } from "@/db/enum";
import { INVOICE_STATUS_LABELS } from "@/db/label";
import { useInvoiceRow } from "@/app/(dashboard)/sponsors/[uuid]/use-invoice-row";

type InvoiceRowProps = {
  invoice: InvoiceRowData;
  canEdit: boolean;
};

/** What the button for an invoice's next step says. */
const STEP_LABELS: Record<InvoiceStatus, string> = {
  draft: "Back to draft",
  issued: "Mark issued",
  paid: "Mark paid",
  void: "Void",
};

/** One invoice: its number, amount, where it stands with its days, and its next steps. */
export const InvoiceRow = ({ invoice, canEdit }: InvoiceRowProps) => {
  const { error, isPending, onStatus } = useInvoiceRow(invoice.uuid);

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-sm text-ink">{invoice.number}</span>
        <span className="text-xs text-muted">
          {formatMoney(invoice.amountMinor, invoice.currency)}
          {invoice.issuedOn ? ` · issued ${formatDate(invoice.issuedOn)}` : ""}
          {invoice.dueOn ? ` · due ${formatDate(invoice.dueOn)}` : ""}
          {invoice.paidOn ? ` · paid ${formatDate(invoice.paidOn)}` : ""}
        </span>
        <FormError message={error ?? undefined} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={invoice.status === "paid" ? "success" : invoice.status === "issued" ? "warning" : "neutral"}>
          {INVOICE_STATUS_LABELS[invoice.status]}
        </Badge>
        {canEdit &&
          NEXT_INVOICE_STATUSES[invoice.status].map((step) => (
            <Button key={step} variant="ghost" size="sm" onClick={() => onStatus(step)} disabled={isPending}>
              {STEP_LABELS[step]}
            </Button>
          ))}
      </div>
    </li>
  );
};
