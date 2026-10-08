import { Ear } from "lucide-react";

/** Nothing recognized in the clip: said plainly, with what usually helps. */
export const SongNotFound = () => (
  <section aria-label="No match" className="flex w-full animate-rise gap-4 rounded-card border border-hairline bg-surface p-5 sm:p-6">
    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hover text-muted">
      <Ear size={18} />
    </span>
    <div className="flex flex-col gap-1.5">
      <h2 className="text-base font-medium text-ink">Couldn’t place that one</h2>
      <p className="text-sm leading-relaxed text-muted">
        Hold the phone closer to the speaker and try again during the chorus or a part with less talking over it. A
        live version or a remix can be hard to name.
      </p>
    </div>
  </section>
);
