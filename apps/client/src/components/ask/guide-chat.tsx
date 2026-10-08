"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "ui";
import { useGuideChat } from "@/app/(app)/ask/use-guide-chat";
import { GuideComposer } from "@/components/ask/guide-composer";
import { GuideIntro } from "@/components/ask/guide-intro";
import { GuideMessage } from "@/components/ask/guide-message";
import { GuideThinking } from "@/components/ask/guide-thinking";

/**
 * THE CONVERSATION: the intro until the first message, then the thread,
 * the message being answered and the guide searching, an error with the
 * unsent message offered again, and the composer pinned underneath.
 */
export const GuideChat = () => {
  const { form, state, isPending, waiting, onSubmit, onKeyDown, ask, retry, endRef } = useGuideChat();
  const empty = state.turns.length === 0 && !waiting;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {empty ? (
          <GuideIntro onAsk={ask} disabled={isPending} />
        ) : (
          <ol className="flex flex-col gap-8 py-6" aria-label="Conversation">
            {state.turns.map((turn, index) => (
              <GuideMessage key={index} turn={turn} />
            ))}
            {waiting && <GuideMessage turn={{ role: "user", text: waiting, picks: [] }} />}
            {waiting && <GuideThinking />}
          </ol>
        )}
        {state.error && !isPending && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-hairline bg-danger-tint px-4 py-3">
            <p className="text-sm text-ink">{state.error}</p>
            {state.unsent && (
              <Button variant="ghost" size="sm" onClick={retry}>
                <RotateCcw size={14} />
                Try again
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <GuideComposer form={form} onSubmit={onSubmit} onKeyDown={onKeyDown} isPending={isPending} />
    </div>
  );
};
