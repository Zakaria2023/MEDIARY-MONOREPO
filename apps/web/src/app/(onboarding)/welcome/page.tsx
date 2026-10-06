import { Metadata } from "next";
import { redirect } from "next/navigation";
import { suggestAvailableUsername } from "services";
import { WelcomeForm } from "@/components/welcome/welcome-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Welcome",
};

/**
 * The one screen between sign-up and the product: pick a handle, confirm a
 * name. A user who already has a handle has nothing to do here and goes
 * home. The layout has already required a session; this page only reads.
 */
const WelcomePage = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  if (user.username) {
    redirect("/");
  }

  const suggestion = await suggestAvailableUsername(
    user.email ?? user.displayName,
  );

  return (
    <WelcomeForm
      suggestedUsername={suggestion}
      displayName={user.displayName}
    />
  );
};

export default WelcomePage;
