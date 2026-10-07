type LandingSectionHeadingProps = {
  /** The small line above: what the section is about, in two or three words. */
  eyebrow: string;
  title: string;
  body: string;
  align?: "center" | "start";
};

/** A landing section's opening: a quiet eyebrow, a large display heading and one paragraph. */
export const LandingSectionHeading = ({ eyebrow, title, body, align = "center" }: LandingSectionHeadingProps) => (
  <div className={`flex flex-col gap-4 ${align === "center" ? "mx-auto max-w-3xl items-center text-center" : "max-w-2xl"}`}>
    <p className="text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</p>
    <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{title}</h2>
    <p className="text-pretty text-base leading-relaxed text-muted sm:text-lg">{body}</p>
  </div>
);
