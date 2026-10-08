import { Sparkles } from "lucide-react";

/** The guide's mark beside everything it says. */
export const GuideMark = () => (
  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
    <Sparkles size={15} />
  </span>
);
