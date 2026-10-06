import { SignOutButton } from "auth";
import { ShieldAlert } from "lucide-react";
import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "No access",
};

/**
 * Where a signed-in account without a staff role lands. A page rather than
 * a redirect to sign-in, because the session is valid and a sign-in screen
 * would either bounce straight back here or report that a session already
 * exists, both of which read as a broken login. This says what happened and
 * offers the one useful action. Public in proxy.ts.
 */
const NoAccessPage = async () => {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hairline text-faint">
          <ShieldAlert size={26} />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl text-ink">
            This account is not a staff account
          </h1>
          <p className="text-sm text-muted">
            {user?.email ? (
              <>
                You are signed in as{" "}
                <span className="text-ink">{user.email}</span>. If it should
                have access, ask an administrator to grant the role.
              </>
            ) : (
              <>
                Your account is signed in, but it has no staff role. If it
                should, ask an administrator to grant one.
              </>
            )}
          </p>
        </div>
        <SignOutButton redirectTo="/sign-in" label="Sign out and use another account" />
        <p className="text-xs leading-relaxed text-faint">
          Mediary and its admin share one sign-in, so this signs you out of
          both.
        </p>
      </div>
    </main>
  );
};

export default NoAccessPage;
