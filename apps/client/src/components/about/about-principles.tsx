const PRINCIPLES = [
  {
    title: "One lifecycle, every medium",
    body: "Five states for everything you track, each said in its medium's own words. Nothing is forced into another medium's shape.",
  },
  {
    title: "History is the truth",
    body: "Every step you log is kept as it happened. Your diary, stats and recap are built from that record, never guessed after the fact.",
  },
  {
    title: "Fast first",
    body: "Logging takes one tap and shows at once. Motion is quick and stops when you ask your device for less.",
  },
  {
    title: "Social is a choice",
    body: "A private library is a complete product. Following, reviews and comparing tastes are there when you want them.",
  },
  {
    title: "Yours to keep",
    body: "Your library and diary download as files whenever you like, and nothing you track is sold or shown to advertisers.",
  },
  {
    title: "Design is the feature",
    body: "Artwork leads, the interface stays quiet, and every empty or loading moment is designed. Your history should look as good as it is.",
  },
];

/** WHAT MEDIARY BELIEVES: six principles that decide arguments before they start, numbered on a hairline grid. */
export const AboutPrinciples = () => (
  <section className="border-y border-hairline bg-surface/40">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-24 sm:px-8 sm:py-32">
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-widest text-accent">What we believe</p>
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">Six rules we build by.</h2>
      </div>
      <ol className="grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((principle, index) => (
          <li key={principle.title} className="flex flex-col gap-4 bg-page p-6 sm:p-8">
            <span className="tabular font-mono text-sm text-accent">0{index + 1}</span>
            <span className="font-display text-xl font-semibold text-ink">{principle.title}</span>
            <span className="text-sm leading-relaxed text-muted">{principle.body}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
