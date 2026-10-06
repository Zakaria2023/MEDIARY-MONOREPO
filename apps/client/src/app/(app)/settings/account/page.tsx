import { Metadata } from "next";
import { AccountSignIn } from "@/components/settings/account-sign-in";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { requireOnboardedUser } from "@/lib/auth";
import { getAccountSummary } from "@/lib/server/account";

export const metadata: Metadata = {
  title: "Account settings",
};

/**
 * How this account signs in, its password, and deleting it. Mediary's own
 * panel; the layout above has already gated the section, and the user
 * lookup here is the key to the account, not a check.
 */
const AccountSettingsPage = async () => {
  const user = await requireOnboardedUser();
  const summary = await getAccountSummary(user.clerkUserId);

  return (
    <div className="flex flex-col gap-6">
      <AccountSignIn summary={summary} />
      <ChangePasswordForm hasPassword={summary.hasPassword} />
      <DeleteAccountForm />
    </div>
  );
};

export default AccountSettingsPage;
