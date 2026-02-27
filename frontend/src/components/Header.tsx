import { Link } from 'react-router-dom';
import './Header.scss';

export default function Header() {
  return (
    <header className="header">
      <nav className="header-nav">
        <Link to="/" className="header-logo">
          download gate
        </Link>
        <div className="header-links">
          <Link to="/login" className="header-btn header-btn--secondary">
            Log in
          </Link>
          <Link to="/signup" className="header-btn header-btn--primary">
            Sign up
          </Link>
          <Link to="/users" className="header-btn header-btn--primary">
            Users
          </Link>
        </div>
      </nav>
    </header>
  );
}
