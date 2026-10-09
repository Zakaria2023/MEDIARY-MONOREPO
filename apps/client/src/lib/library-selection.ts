"use client";

import { createContext, useContext } from "react";
import { useLibrarySelection } from "@/app/(app)/library/use-library-selection";

export type LibrarySelection = ReturnType<typeof useLibrarySelection>;

/** The library's select mode, shared by the toggle, every row and card, and the bar. */
export const LibrarySelectionContext = createContext<LibrarySelection | null>(null);

/** The select mode, or null where there is none: a row drawn outside the library picks nothing. */
export const useLibrarySelectionContext = (): LibrarySelection | null => useContext(LibrarySelectionContext);
