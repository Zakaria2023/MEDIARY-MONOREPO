import { Clock } from "lucide-react";
import { CreatorState } from "services";
import { formatDate } from "utils";
import { CREATOR_CATEGORY_LABELS } from "@/db/label";

type CreatorPendingProps = {
  state: CreatorState;
};

/** A request waiting for staff: the code to post, where to post it, and what happens next. */
export const CreatorPending = ({ state }: CreatorPendingProps) => (
  <section className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline text-warning">
        <Clock size={18} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg text-ink">Your request is with staff</h2>
        <p className="text-sm text-muted">
          Sent {formatDate(state.requestedAt)} as a {CREATOR_CATEGORY_LABELS[state.category].toLowerCase()}. Put this code in the bio
          or description of one of the channels below, and leave it there until you hear back.
        </p>
      </div>
    </div>
    <p className="w-fit select-all rounded-control border border-hairline-strong bg-page px-4 py-2.5 font-mono text-base text-ink">
      {state.code}
    </p>
    <ul className="flex flex-col gap-1.5 text-sm">
      {state.proofUrls.map((url) => (
        <li key={url} className="line-clamp-1 break-all text-secondary">
          {url}
        </li>
      ))}
    </ul>
    <p className="text-xs text-muted">
      Staff check that the code is there, then verify you or say why not. The links you gave are deleted once they decide.
    </p>
  </section>
);
