"use client";

import { ReactNode } from "react";
import { useLibrarySelection } from "@/app/(app)/library/use-library-selection";
import { LibrarySelectionContext } from "@/lib/library-selection";

type LibrarySelectionProviderProps = {
  children: ReactNode;
};

/** Holds the library's select mode for everything inside it. */
export const LibrarySelectionProvider = ({ children }: LibrarySelectionProviderProps) => (
  <LibrarySelectionContext value={useLibrarySelection()}>{children}</LibrarySelectionContext>
);
