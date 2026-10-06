import { KeyRound, Mail, UserRound } from "lucide-react";
import { EMPTY_VALUE } from "utils";
import { AccountSummary } from "@/lib/server/account";

type AccountSignInProps = {
  summary: AccountSummary;
};

/** How this account signs in: its email, its password, its Google link. */
export const AccountSignIn = ({ summary }: AccountSignInProps) => (
  <section className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6">
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-lg text-ink">Sign-in</h2>
      <p className="text-sm text-muted">How you get into your Mediary.</p>
    </div>
    <ul className="flex flex-col divide-y divide-hairline">
      <li className="flex items-center gap-3 py-3 first:pt-0">
        <Mail size={18} className="shrink-0 text-muted" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-ink">Email</span>
          <span className="line-clamp-1 text-sm text-muted">{summary.email ?? EMPTY_VALUE}</span>
        </div>
      </li>
      <li className="flex items-center gap-3 py-3">
        <KeyRound size={18} className="shrink-0 text-muted" />
        <div className="flex flex-col">
          <span className="text-sm text-ink">Password</span>
          <span className="text-sm text-muted">{summary.hasPassword ? "Set" : "Not set yet"}</span>
        </div>
      </li>
      <li className="flex items-center gap-3 py-3 last:pb-0">
        <UserRound size={18} className="shrink-0 text-muted" />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-ink">Google</span>
          <span className="line-clamp-1 text-sm text-muted">
            {summary.googleEmail ? `Connected as ${summary.googleEmail}` : "Not connected"}
          </span>
        </div>
      </li>
    </ul>
  </section>
);
