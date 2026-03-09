import { Link } from 'react-router-dom';
import './Home.scss';

const GITHUB_URL = 'https://github.com/robin-lake/download-gate';

export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="home__hero-title">
          Your music deserves an audience you can reach freely.
        </h1>
        <p className="home__hero-subtitle">
          Free download gates to grow your listeners and followers.
        </p>
        <p className="home__hero-tagline">
          No subscription. No fees. Ever.
        </p>
        <Link to="/signup">
          <button className="home__cta">Get started free</button>
        </Link>
      </section>

      <section className="home__intro">
        <h2 className="home__section-title">Turn listeners into followers.</h2>
        <p className="home__section-text">
          Fans get your music, you get new followers. You can ask for a follow on SoundCloud, Bandcamp, or your streaming platform of choice. Your audience grows where you already exist, and new listeners become people who'll see your next release.
        </p>
      </section>

      <section className="home__benefits">
        <h2 className="home__section-title">Why download gates?</h2>
        <div className="home__benefits-grid">
          <div className="home__benefit-card">
            <h3>Grow where you already are</h3>
            <p>Get follows on SoundCloud, Bandcamp, or streaming—platforms where your catalog lives. New listeners become followers who'll see your next drop instead of one-off visitors.</p>
          </div>
          <div className="home__benefit-card">
            <h3>Better engagement</h3>
            <p>People who follow to unlock a track are more likely to stream again and share. You're building an audience that shows up for your next release.</p>
          </div>
          <div className="home__benefit-card">
            <h3>Real fans</h3>
            <p>Listeners who follow or subscribe for a download are your most engaged audience. They stream, buy on Bandcamp, and support what you do next.</p>
          </div>
        </div>
      </section>

      <section className="home__how">
        <h2 className="home__section-title">How download gates work</h2>
        <div className="home__how-steps">
          <div className="home__how-step">
            <span className="home__how-num">1</span>
            <p>Create a gate, upload your track and artwork, and customize the landing page.</p>
          </div>
          <div className="home__how-step">
            <span className="home__how-num">2</span>
            <p>Share your gate link on socials, Bandcamp, SoundCloud, or anywhere you promote.</p>
          </div>
          <div className="home__how-step">
            <span className="home__how-num">3</span>
            <p>Fans complete a simple step—like following you on SoundCloud, Bandcamp, or your streaming page—and get the download.</p>
          </div>
          <div className="home__how-step">
            <span className="home__how-num">4</span>
            <p>You gain new followers on the platforms you care about—no lock-in, no middleman.</p>
          </div>
        </div>
      </section>

      {/* <section className="home__smart-links">
        <h2 className="home__section-title">How smart links work</h2>
        <p className="home__section-text">
          Smart links are one URL that sends fans to their preferred platform. Instead of listing Spotify, Apple Music, Bandcamp, YouTube, and others separately, you share a single link. Fans click, pick their service, and land exactly where they want to listen. You get analytics in one place instead of scattered across platforms.
        </p>
        <p className="home__section-text home__section-text--muted">
          This service combines download gates with smart links—one link for both gated downloads and streaming.
        </p>
      </section> */}

      {/* <section className="home__free">
        <h2 className="home__section-title">100% free</h2>
        <p className="home__section-text home__free-text">
          No plans, no trials, no upsells. Built for artists who want to grow without paying a subscription.
        </p>
      </section> */}

      <section className="home__opensource">
        <h2 className="home__section-title">Open source</h2>
        <p className="home__section-text">
          This project is open source. You can run it yourself, fork it, and customize it
        </p>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="home__github-link">
          Fork on GitHub
        </a>
      </section>

      {/* <section className="home__donate">
        <h2 className="home__section-title">Support the project</h2>
        <p className="home__section-text">
          This service is free to use. If it helps you, consider leaving a tip to support development and hosting.
        </p>
        <div className="home__donate-buttons"> */}
          {/* Ko-fi: replace YOUR_USERNAME with your actual Ko-fi username. No API key needed. */}
          {/* <a
            href="https://ko-fi.com/YOUR_USERNAME"
            target="_blank"
            rel="noopener noreferrer"
            className="home__donate-btn home__donate-btn--kofi"
          >
            Buy me a coffee (Ko-fi)
          </a> */}
          {/* Alternative: Stripe one-time payment link. Replace with your Stripe Payment Link. */}
          {/* <a
            href="https://donate.stripe.com/YOUR_STRIPE_LINK"
            target="_blank"
            rel="noopener noreferrer"
            className="home__donate-btn home__donate-btn--stripe"
          >
            Donate (Stripe)
          </a>
        </div>
        <p className="home__donate-note">
          Set up Ko-fi at ko-fi.com or a Stripe Payment Link at dashboard.stripe.com and replace the URLs above.
        </p>
      </section> */}

      <section className="home__final-cta">
        <h2 className="home__section-title">Want to try?</h2>
        <Link to="/signup">
          <button className="home__cta">Sign up free</button>
        </Link>
      </section>
    </div>
  );
}
