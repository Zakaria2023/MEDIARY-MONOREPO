import { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Account settings",
};

/**
 * Email, password, connected accounts, sessions and deletion are Clerk's,
 * so this section is Clerk's own panel in Mediary's colors. Nothing here
 * writes a Mediary table; the webhook mirrors what changes.
 */
const AccountSettingsPage = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-lg text-ink">Account</h2>
      <p className="text-sm text-muted">
        Sign-in email, password, connected accounts and active sessions.
      </p>
    </div>
    <UserProfile routing="hash" />
  </div>
);

export default AccountSettingsPage;
