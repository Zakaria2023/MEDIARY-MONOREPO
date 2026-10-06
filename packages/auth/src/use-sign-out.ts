"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

/** Signs out of this browser and goes to `redirectTo`. */
export const useSignOut = (redirectTo: string) => {
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const onSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectUrl: redirectTo });
  };

  return { isSigningOut, onSignOut };
};
