/**
 * WHY IT EXISTS, in an editorial layout: the pull quote on one side, the
 * story in three short paragraphs on the other.
 */
export const AboutStory = () => (
  <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[2fr_3fr] lg:gap-20">
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Why</p>
      <blockquote className="text-balance font-display text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-3xl">
        &ldquo;The show you finished last spring, the game you sank a winter into, the album that carried a year. They are one story. They were
        never kept as one.&rdquo;
      </blockquote>
    </div>
    <div className="flex flex-col gap-6 text-base leading-relaxed text-muted sm:text-lg">
      <p>
        Most people who love stories love more than one kind. The same person watches anime on weeknights, plays a long game on weekends, reads
        on the train and has an album on repeat. Each of those lives in a different app, with a different account, a different scale and a
        different idea of what &ldquo;finished&rdquo; means.
      </p>
      <p>
        Mediary puts them in one place without flattening them. A game is played and beaten, a book can be a DNF, music is listened, and every
        medium keeps its own words and its own way of counting. Underneath, one lifecycle and one diary tie it all together, so your year can
        finally be seen whole.
      </p>
      <p>
        It is built to be fast, to look like it was made by people who care about the things you track, and to stay yours: private if you
        want, social when you choose, and easy to take with you.
      </p>
    </div>
  </section>
);
