import { Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/robin-lake/download-gate";

const IMG = {
  hero: "/images/home/hero-synth.jpg",
  studio: "/images/home/feature-studio.jpg",
  drums: "/images/home/feature-drums.jpg",
  gear: "/images/home/feature-gear.jpg",
} as const;

const CREDITS = [
  { label: "Alexey Demidov", href: "https://www.pexels.com/photo/12409937/" },
  { label: "TStudio", href: "https://www.pexels.com/photo/8042662/" },
  { label: "Pixabay", href: "https://www.pexels.com/photo/164745/" },
  { label: "Dmitry Demidov", href: "https://www.pexels.com/photo/3784221/" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#0c0a0f] text-zinc-200">
      {/* Hero */}
      <section
        className="relative flex min-h-[85vh] items-center md:min-h-[90vh]"
        aria-labelledby="home-hero-heading"
      >
        <div className="absolute inset-0">
          <img
            src={IMG.hero}
            alt="Synthesizer keyboard and music production workstation seen from above on a wooden surface"
            className="absolute inset-0 size-full object-cover"
            width={1920}
            height={1280}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0c0a0f] via-[#0c0a0f]/90 to-[#0c0a0f]/55"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#0c0a0f]/95 via-transparent to-[#1a1025]/50"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
          <p className="font-display mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
            For producers &amp; electronic artists
          </p>
          <h1
            id="home-hero-heading"
            className="font-display mb-6 max-w-3xl text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-white"
          >
            Gate your drops. Grow your scene.
          </h1>
          <p className="mb-4 max-w-xl text-lg leading-relaxed text-zinc-300 md:text-xl">
            Free download gates for your tracks—whether you live on SoundCloud,
            Bandcamp, or streaming. Fans unlock a WAV or MP3; you earn follows
            where your music already lives.
          </p>
          <p className="mb-10 max-w-xl text-sm font-medium text-violet-200/80">
            No subscription. No fees. Built for independent electronic musicians.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="inline-flex rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
            >
              Get started free
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-400 underline-offset-4 transition hover:text-cyan-300 hover:underline"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="relative border-t border-white/5 bg-[#0c0a0f] px-6 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(139,92,246,0.04),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            From the studio to the crowd
          </h2>
          <p className="text-base leading-relaxed text-zinc-400 md:text-lg">
            You&apos;re not just chasing streams—you&apos;re building a list of people
            who care about your next release. Download gates turn one listen into a
            follow, a save, or a mailing list signup. Works for techno, house, DnB,
            ambient, and everything in between.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16 md:py-20" aria-labelledby="why-gates">
        <div className="mx-auto max-w-6xl">
          <h2
            id="why-gates"
            className="font-display mb-10 text-center text-2xl font-bold text-white md:text-3xl"
          >
            Why download gates?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-violet-500/20 bg-zinc-900/50 p-6 backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-zinc-900/70">
              <h3 className="font-display mb-3 text-lg font-semibold text-cyan-200">
                Grow where you already are
              </h3>
              <p className="m-0 text-sm leading-relaxed text-zinc-400">
                Point fans to SoundCloud, Bandcamp, Spotify, or Instagram—wherever
                your catalog and community live. New listeners become followers who
                see your next drop.
              </p>
            </article>
            <article className="rounded-2xl border border-violet-500/20 bg-zinc-900/50 p-6 backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-zinc-900/70">
              <h3 className="font-display mb-3 text-lg font-semibold text-cyan-200">
                Better engagement
              </h3>
              <p className="m-0 text-sm leading-relaxed text-zinc-400">
                People who follow or save to unlock a track are more likely to come
                back for EPs, remixes, and club edits. You build a habit, not a
                one-off click.
              </p>
            </article>
            <article className="rounded-2xl border border-violet-500/20 bg-zinc-900/50 p-6 backdrop-blur-sm transition hover:border-cyan-400/30 hover:bg-zinc-900/70 sm:col-span-2 lg:col-span-1">
              <h3 className="font-display mb-3 text-lg font-semibold text-cyan-200">
                Real fans
              </h3>
              <p className="m-0 text-sm leading-relaxed text-zinc-400">
                The fans who jump through a small hoop for your audio are the ones
                who buy on Bandcamp, share your links, and show up when you tour.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Gear strip */}
      <section
        className="border-y border-white/5 bg-black/40 px-6 py-12 md:py-16"
        aria-label="Studio and electronic music production imagery"
      >
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <figure className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/30">
            <img
              src={IMG.studio}
              alt="Several synthesizers and mixers arranged on a wooden table in a studio"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
              width={1200}
              height={2133}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </figure>
          <figure className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/30">
            <img
              src={IMG.drums}
              alt="Close-up of an audio mixer with illuminated knobs for music production"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </figure>
          <figure className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/30 md:col-span-1">
            <img
              src={IMG.gear}
              alt="Illuminated DJ mixer with colorful LED pads in a dark studio"
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
              width={1200}
              height={900}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </figure>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 md:py-20" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-3xl">
          <h2
            id="how-it-works"
            className="font-display mb-10 text-center text-2xl font-bold text-white md:text-3xl"
          >
            How it works
          </h2>
          <ol className="m-0 list-none space-y-6 p-0">
            {[
              "Create a gate: upload your track and artwork, pick your steps (follow, save, email, etc.).",
              "Share your link—Bio, Discord, release post, or QR at the booth.",
              "Fans complete a quick action and get the download. You keep the relationship on your terms.",
              "Repeat for every single, remix pack, or stem drop—same workflow, bigger list.",
            ].map((text, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="m-0 pt-1 leading-relaxed text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Open source */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 px-8 py-10 text-center backdrop-blur-sm">
          <h2 className="font-display mb-4 text-xl font-bold text-white md:text-2xl">
            Open source
          </h2>
          <p className="mb-6 text-zinc-400">
            Fork it, self-host it, or hack on the UI. The project is on GitHub for
            artists who want control without a middleman.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex font-semibold text-violet-300 underline-offset-4 transition hover:text-cyan-300 hover:underline"
          >
            Fork on GitHub
          </a>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-12 pt-4 text-center md:pb-20">
        <h2 className="font-display mb-6 text-2xl font-bold text-white">
          Ready for your next release?
        </h2>
        <Link
          to="/signup"
          className="inline-flex rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Sign up free
        </Link>
      </section>

      {/* Credits */}
      <footer className="border-t border-white/5 px-6 py-8">
        <p className="mx-auto max-w-4xl text-center text-xs leading-relaxed text-zinc-600">
          Photos:{" "}
          {CREDITS.map((c, i) => (
            <span key={c.href}>
              {i > 0 ? " · " : null}
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
              >
                {c.label}
              </a>
            </span>
          ))}{" "}
          on{" "}
          <a
            href="https://www.pexels.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 underline-offset-2 hover:text-zinc-400 hover:underline"
          >
            Pexels
          </a>
        </p>
      </footer>
    </div>
  );
}
