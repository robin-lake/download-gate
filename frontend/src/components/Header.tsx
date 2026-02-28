import { Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import './Header.scss';

export default function Header() {
  return (
    <header className="header">
      <nav className="header-nav">
        <Link to="/" className="header-logo">
          download gate
        </Link>
        <div className="header-links">
          <SignedOut>
            <Link to="/login">
              <button className="header-btn header-btn--secondary">Log in</button>
            </Link>
            <Link to="/signup">
              <button className="header-btn header-btn--primary">Sign up</button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/users" className="header-btn header-btn--secondary">
              Users
            </Link>
            <Link to="/me" className="header-btn header-btn--secondary">
              Me
            <UserButton afterSignOutUrl="/" />
            </Link>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
