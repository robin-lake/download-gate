import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.scss';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Download Gate</h1>
        <p className="tagline">Turn followers into subscribers with smart download gates.</p>
        <nav className="home-nav">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <section className="home-features">
        <h2>How it works</h2>
        <ul>
          <li>Create a download gate and share the link.</li>
          <li>Fans follow or subscribe to unlock the file.</li>
          <li>Grow your audience and track conversions in one place.</li>
        </ul>
      </section>
    </div>
  );
}
