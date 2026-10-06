"use client";

import { Heart, Minus, Plus, Star } from "lucide-react";
import { Button, Input, Sheet, Textarea } from "ui";
import { useEntryDraft } from "@/app/design/add/use-entry-draft";
import { PosterArt } from "@/components/media/poster-art";
import { MEDIA_TYPE_LABEL, MockStatus, MockTitle, STATUS_LABEL } from "@/lib/design/mock";

type AddSheetProps = {
  title: MockTitle;
};

const STATUSES: MockStatus[] = [
  "in_progress",
  "completed",
  "paused",
  "dropped",
  "planned",
];

const STATUS_DOT: Record<MockStatus, string> = {
  in_progress: "bg-status-progress",
  completed: "bg-status-completed",
  paused: "bg-status-paused",
  dropped: "bg-status-dropped",
  planned: "bg-status-planned",
};

/**
 * THE HEARTBEAT. The sheet opens with the current state already filled in:
 * the status row first because it is the whole of most saves, then score
 * and progress as big targets, then the optional fields folded under. Save
 * is pinned at the bottom so it is under the thumb on a phone.
 */
export const AddSheet = ({ title }: AddSheetProps) => {
  const { draft, open, setOpen, setStatus, setScore, bumpProgress, toggleFavorite } =
    useEntryDraft({ status: "in_progress", score: null, progress: 19, favorite: false });

  const labels = STATUS_LABEL[title.type];

  return (
    <>
      {!open && (
        <div className="flex flex-col items-center gap-3 py-24">
          <p className="text-sm text-muted">The sheet is closed.</p>
          <Button onClick={() => setOpen(true)}>Open it again</Button>
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        label={`Update ${title.title}`}
        header={
          <div className="flex items-center gap-3">
            <PosterArt title={title} className="w-11" />
            <div className="flex min-w-0 flex-col">
              <span className="line-clamp-1 font-display text-base text-ink">
                {title.title}
              </span>
              <span className="text-xs text-muted">
                {`${MEDIA_TYPE_LABEL[title.type]} · ${title.year}`}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="icon"
              aria-pressed={draft.favorite}
              aria-label="Favorite"
              onClick={toggleFavorite}
              className={draft.favorite ? "border-pink text-pink" : ""}
            >
              <Heart size={18} className={draft.favorite ? "fill-current" : ""} />
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Save
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-7">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
              Status
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map((status) => {
                const selected = draft.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setStatus(status)}
                    className={`flex h-11 cursor-pointer items-center gap-2.5 rounded-control border px-3 text-sm font-medium transition-colors ${
                      selected
                        ? "border-accent bg-accent-tint text-ink"
                        : "border-hairline text-secondary hover:border-hairline-strong hover:text-ink"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-faint">
              Score
              <span className="tabular text-sm normal-case tracking-normal text-ink">
                {draft.score === null ? "Not rated" : `${draft.score} / 10`}
              </span>
            </legend>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
                const filled = draft.score !== null && value <= draft.score;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} out of 10`}
                    onClick={() => setScore(draft.score === value ? null : value)}
                    className={`flex h-9 flex-1 cursor-pointer items-center justify-center rounded transition-colors ${
                      filled ? "text-warning" : "text-faint hover:text-muted"
                    }`}
                  >
                    <Star size={18} className={filled ? "fill-current" : ""} />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-faint">
              Progress
            </legend>
            <div className="flex items-center gap-3">
              <Button variant="icon" size="lg" aria-label="One less" onClick={() => bumpProgress(-1)}>
                <Minus size={18} />
              </Button>
              <div className="flex flex-1 flex-col items-center">
                <span className="tabular font-display text-3xl font-semibold text-ink">
                  {draft.progress}
                  <span className="text-lg text-muted"> / 28</span>
                </span>
                <span className="text-xs text-muted">episodes</span>
              </div>
              <Button variant="icon" size="lg" aria-label="One more" onClick={() => bumpProgress(1)}>
                <Plus size={18} />
              </Button>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Started" type="date" defaultValue="2026-09-05" />
            <Input label="Finished" type="date" />
          </div>

          <Textarea label="Notes" placeholder="Anything you want to remember." rows={3} />
        </div>
      </Sheet>
    </>
  );
};
