import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  UserButton, 
} from '@clerk/clerk-react';
export default function Header() {
  return (
    <header className="border-b border-black/[0.08] bg-white/95 dark:border-white/10 dark:bg-[rgba(18,18,18,0.95)]">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <SignedIn>
          {/* <Link to="/dashboard" className="header-logo"> */}
          <Link
            to="/"
            className="text-[1.25rem] font-semibold tracking-tight text-[#213547] no-underline hover:text-[#646cff] dark:text-white/90 dark:hover:text-[#646cff]"
          >
            download gate
          </Link>          
        </SignedIn>
        <SignedOut>
         <Link
           to="/"
           className="text-[1.25rem] font-semibold tracking-tight text-[#213547] no-underline hover:text-[#646cff] dark:text-white/90 dark:hover:text-[#646cff]"
         >
           download gate
         </Link>
        </SignedOut>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link to="/login">
              <button
                type="button"
                className="rounded-lg border border-black/15 bg-transparent px-4 py-2 text-[0.9rem] font-medium text-[#213547] no-underline transition-colors hover:bg-black/[0.04] dark:border-white/20 dark:text-white/90 dark:hover:bg-white/[0.06]"
              >
                Log in
              </button>
            </Link>
            <Link to="/signup">
              <button
                type="button"
                className="rounded-lg border-none bg-[#646cff] px-4 py-2 text-[0.9rem] font-medium text-white no-underline transition-colors hover:bg-[#535bf2]"
              >
                Sign up
              </button>
            </Link>
          </SignedOut>
          <SignedIn>
            {/* <Link to="/users" className="header-btn header-btn--secondary">
              Users
            </Link> */}
            {/* <Link to="/me" className="header-btn header-btn--secondary">
              Me
            </Link> */}
            <Link
              to="/dashboard"
              className="rounded-lg border border-black/15 bg-transparent px-4 py-2 text-[0.9rem] font-medium text-[#213547] no-underline transition-colors hover:bg-black/[0.04] dark:border-white/20 dark:text-white/90 dark:hover:bg-white/[0.06]"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
