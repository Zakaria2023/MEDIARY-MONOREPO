import { GuideThreadTurn } from "services";
import { GuideMark } from "@/components/ask/guide-mark";
import { GuidePickRow } from "@/components/ask/guide-pick-row";

type GuideMessageProps = {
  turn: Pick<GuideThreadTurn, "role" | "text" | "picks">;
};

/**
 * One turn of the conversation. The member's words sit on the end edge in a
 * bubble; the guide's sit beside its mark, with its picks as poster rows
 * under them.
 */
export const GuideMessage = ({ turn }: GuideMessageProps) =>
  turn.role === "user" ? (
    <li className="flex animate-rise justify-end">
      <p className="max-w-md whitespace-pre-line rounded-card border border-hairline bg-surface-2 px-4 py-2.5 text-sm leading-relaxed text-ink sm:max-w-lg">
        {turn.text}
      </p>
    </li>
  ) : (
    <li className="flex animate-rise gap-3">
      <GuideMark />
      <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1">
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-secondary">
          {turn.text.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
        {turn.picks.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {turn.picks.map((pick) => (
              <GuidePickRow key={pick.title.uuid} pick={pick} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
