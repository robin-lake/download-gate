import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';

const logoClass =
  'font-display text-[1.25rem] font-semibold tracking-tight text-zinc-900 no-underline transition-colors hover:text-violet-600';

const secondaryNavClass =
  'rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 no-underline shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';

const primaryCtaClass =
  'rounded-lg border-none bg-gradient-to-r from-violet-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-md shadow-violet-500/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500';

export default function Header() {
  return (
    <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <SignedIn>
          <Link to="/" className={logoClass}>
            download gate
          </Link>
        </SignedIn>
        <SignedOut>
          <Link to="/" className={logoClass}>
            download gate
          </Link>
        </SignedOut>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link to="/login" className={secondaryNavClass}>
              Log in
            </Link>
            <Link to="/signup" className={primaryCtaClass}>
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className={secondaryNavClass}>
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
