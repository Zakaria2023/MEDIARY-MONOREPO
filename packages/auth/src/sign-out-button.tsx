"use client";

import { LogOut } from "lucide-react";
import { Button } from "ui";
import { useSignOut } from "./use-sign-out";

type SignOutButtonProps = {
  redirectTo: string;
  label?: string;
};

/** A plain sign-out button in Mediary's own style. */
export const SignOutButton = ({ redirectTo, label = "Sign out" }: SignOutButtonProps) => {
  const { isSigningOut, onSignOut } = useSignOut(redirectTo);

  return (
    <Button variant="outline" onClick={onSignOut} disabled={isSigningOut}>
      <LogOut size={16} />
      {isSigningOut ? "Signing out" : label}
    </Button>
  );
};
