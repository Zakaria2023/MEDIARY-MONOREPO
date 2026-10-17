import { RotateCcw } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { isGuideReady } from "services";
import { firstParam } from "validators";
import { GuideChat } from "@/components/ask/guide-chat";
import { GuideUnavailable } from "@/components/ask/guide-unavailable";
import { SectionHeading } from "@/components/shared/section-heading";
import { pageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: "Ask",
  description: "Tell the guide what you're in the mood for and get something to watch, play, read or hear.",
  path: "/ask",
  noIndex: true,
});

/**
 * ASK: a conversation with Mediary's recommendation guide. "Start over" is
 * a link to the next `c`, a new key that remounts the conversation empty.
 */
const AskPage = async ({ searchParams }: Props) => {
  const conversation = Number(firstParam((await searchParams).c)) || 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-8 sm:px-8 sm:pt-10">
      <SectionHeading
        size="page"
        title="Ask"
        description="Recommendations from everything in Mediary, in conversation."
        action={
          <Link
            href={`/ask?c=${conversation + 1}`}
            className="flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <RotateCcw size={14} />
            Start over
          </Link>
        }
      />
      {isGuideReady() ? <GuideChat key={conversation} /> : <div className="py-8"><GuideUnavailable /></div>}
    </main>
  );
};

export default AskPage;
