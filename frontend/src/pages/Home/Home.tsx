import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/robin-lake/download-gate';

export default function Home() {
  return (
    <div className="min-h-screen w-screen bg-[#1b181e] text-[#dcd2eb]">
      <section className="mx-auto max-w-[720px] px-6 pb-20 pt-16 text-center">
        <h1 className="mb-4 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight text-[#dcd2eb]">
          Your music deserves an audience you can reach freely.
        </h1>
        <p className="mb-2 text-[1.15rem] text-[rgba(220,210,235,0.65)]">
          Free download gates to grow your listeners and followers.
        </p>
        <p className="mb-8 text-[0.95rem] font-medium text-[rgba(184,160,232,0.6)]">
          No subscription. No fees. Ever.
        </p>
        <Link to="/signup">
          <button
            type="button"
            className="inline-block cursor-pointer rounded-md border-none bg-[#b8a0e8] px-8 py-[0.85rem] text-base font-semibold text-[#1b181e] no-underline transition-all hover:-translate-y-px hover:bg-[#c4b0ef]"
          >
            Get started free
          </button>
        </Link>
      </section>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h2 className="mb-4 text-center text-[1.35rem] font-semibold tracking-tight">
          Turn listeners into followers.
        </h2>
        <p className="mx-auto mb-4 max-w-[640px] text-center leading-relaxed text-[rgba(220,210,235,0.65)]">
          Fans get your music, you get new followers. You can ask for a follow on SoundCloud, Bandcamp, or your streaming platform of choice. Your audience grows where you already exist, and new listeners become people who'll see your next release.
        </p>
      </section>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h2 className="mb-4 text-center text-[1.35rem] font-semibold tracking-tight">
          Why download gates?
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-lg border border-[rgba(161,138,189,0.1)] bg-[#131018] p-6 text-left transition-colors hover:border-[rgba(161,138,189,0.2)] hover:bg-[#18141f]">
            <h3 className="mb-2 text-base font-semibold text-[#b8a0e8]">Grow where you already are</h3>
            <p className="m-0 text-[0.9rem] leading-relaxed text-[rgba(220,210,235,0.65)]">
              Get follows on SoundCloud, Bandcamp, or streaming—platforms where your catalog lives. New listeners become followers who'll see your next drop instead of one-off visitors.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(161,138,189,0.1)] bg-[#131018] p-6 text-left transition-colors hover:border-[rgba(161,138,189,0.2)] hover:bg-[#18141f]">
            <h3 className="mb-2 text-base font-semibold text-[#b8a0e8]">Better engagement</h3>
            <p className="m-0 text-[0.9rem] leading-relaxed text-[rgba(220,210,235,0.65)]">
              People who follow to unlock a track are more likely to stream again and share. You're building an audience that shows up for your next release.
            </p>
          </div>
          <div className="rounded-lg border border-[rgba(161,138,189,0.1)] bg-[#131018] p-6 text-left transition-colors hover:border-[rgba(161,138,189,0.2)] hover:bg-[#18141f]">
            <h3 className="mb-2 text-base font-semibold text-[#b8a0e8]">Real fans</h3>
            <p className="m-0 text-[0.9rem] leading-relaxed text-[rgba(220,210,235,0.65)]">
              Listeners who follow or subscribe for a download are your most engaged audience. They stream, buy on Bandcamp, and support what you do next.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h2 className="mb-4 text-center text-[1.35rem] font-semibold tracking-tight">
          How download gates work
        </h2>
        <div className="mt-8 flex flex-col gap-5">
          <div className="flex items-start gap-4 text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[rgba(184,160,232,0.6)] text-[0.8rem] font-bold text-[#1b181e]">
              1
            </span>
            <p className="m-0 leading-relaxed text-[rgba(220,210,235,0.65)]">
              Create a gate, upload your track and artwork, and customize the landing page.
            </p>
          </div>
          <div className="flex items-start gap-4 text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[rgba(184,160,232,0.6)] text-[0.8rem] font-bold text-[#1b181e]">
              2
            </span>
            <p className="m-0 leading-relaxed text-[rgba(220,210,235,0.65)]">
              Share your gate link on socials, Bandcamp, SoundCloud, or anywhere you promote.
            </p>
          </div>
          <div className="flex items-start gap-4 text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[rgba(184,160,232,0.6)] text-[0.8rem] font-bold text-[#1b181e]">
              3
            </span>
            <p className="m-0 leading-relaxed text-[rgba(220,210,235,0.65)]">
              Fans complete a simple step—like following you on SoundCloud, Bandcamp, or your streaming page—and get the download.
            </p>
          </div>
          <div className="flex items-start gap-4 text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[rgba(184,160,232,0.6)] text-[0.8rem] font-bold text-[#1b181e]">
              4
            </span>
            <p className="m-0 leading-relaxed text-[rgba(220,210,235,0.65)]">
              You gain new followers on the platforms you care about—no lock-in, no middleman.
            </p>
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

      <section className="mx-auto max-w-[880px] px-6 py-12">
        <h2 className="mb-4 text-center text-[1.35rem] font-semibold tracking-tight">
          Open source
        </h2>
        <p className="mx-auto mb-4 max-w-[640px] text-center leading-relaxed text-[rgba(220,210,235,0.65)]">
          This project is open source. You can run it yourself, fork it, and customize it
        </p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-semibold text-[#b8a0e8] no-underline transition-colors hover:text-[#d4c4f5]"
        >
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

      <section className="mx-auto max-w-[880px] px-6 pb-16 pt-12 text-center">
        <h2 className="mb-4 text-[1.35rem] font-semibold tracking-tight">Want to try?</h2>
        <Link to="/signup">
          <button
            type="button"
            className="inline-block cursor-pointer rounded-md border-none bg-[#b8a0e8] px-8 py-[0.85rem] text-base font-semibold text-[#1b181e] no-underline transition-all hover:-translate-y-px hover:bg-[#c4b0ef]"
          >
            Sign up free
          </button>
        </Link>
      </section>
    </div>
  );
}
