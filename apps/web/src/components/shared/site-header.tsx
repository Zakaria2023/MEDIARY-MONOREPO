import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Settings } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

/**
 * The real header, as far as Step 1 takes it: the mark, and either the
 * sign-in link or Clerk's user menu beside a settings link. The full app
 * shell with the four destinations arrives with the screens it navigates
 * to; until then the prototype under /design is where that lives.
 */
export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b border-hairline bg-page/80 backdrop-blur-md">
    <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5 sm:px-8">
      <Link href="/" aria-label="Mediary home">
        <Logo />
      </Link>
      <div className="ms-auto flex items-center gap-2">
        <SignedOut>
          <Link
            href="/sign-in"
            className="flex h-9 items-center rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="flex h-9 items-center rounded-control bg-primary px-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Create your Mediary
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/settings/profile"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <Settings size={18} />
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  </header>
);
