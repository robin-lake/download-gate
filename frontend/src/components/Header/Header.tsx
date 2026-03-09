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
        <SignedIn>
          <Link to="/dashboard" className="header-logo">
            download gate
          </Link>          
        </SignedIn>
        <SignedOut>
         <Link to="/" className="header-logo">
           download gate
         </Link>
        </SignedOut>
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
            {/* <Link to="/users" className="header-btn header-btn--secondary">
              Users
            </Link> */}
            {/* <Link to="/me" className="header-btn header-btn--secondary">
              Me
            </Link> */}
            <Link to="/dashboard" className="header-btn header-btn--secondary">
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
