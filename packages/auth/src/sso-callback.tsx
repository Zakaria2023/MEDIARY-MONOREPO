"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";

type SsoCallbackProps = {
  /** Where an existing account lands. */
  signInRedirect: string;
  /** Where a brand-new account lands: the welcome screen. */
  signUpRedirect: string;
  /** Where to send someone whose Google sign-in could not finish. */
  signInHref: string;
};

/**
 * Where Google sends a person back to. The identity service's callback
 * finishes the sign-in or sign-up and draws nothing of its own; what the
 * person sees for that second is Mediary's spinner.
 */
export const SsoCallback = ({ signInRedirect, signUpRedirect, signInHref }: SsoCallbackProps) => (
  <div className="flex flex-col items-center gap-3 py-16 text-center">
    <LoaderCircle size={24} className="animate-spin text-accent" />
    <p className="text-sm text-muted">Signing you in</p>
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl={signInRedirect}
      signUpForceRedirectUrl={signUpRedirect}
      signInUrl={signInHref}
      signUpUrl={signInHref}
    />
  </div>
);
