import { Link } from 'react-router-dom';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__sections">
          <section className="footer__section">
            <h3 className="footer__heading">Product</h3>
            <ul className="footer__links">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/new-download-gate">Create Gate</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </ul>
          </section>
          <section className="footer__section">
            <h3 className="footer__heading">Resources</h3>
            <ul className="footer__links">
              <li>
                <a href="https://github.com/robin-lake/download-gate" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li><Link to="/login">Log In</Link></li>
            </ul>
          </section>
          <section className="footer__section">
            <h3 className="footer__heading">Legal</h3>
            <ul className="footer__links">
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </section>
        </div>
        <div className="footer__bottom">
          <span className="footer__copy">download gate · free for independent artists</span>
        </div>
      </div>
    </footer>
  );
}
