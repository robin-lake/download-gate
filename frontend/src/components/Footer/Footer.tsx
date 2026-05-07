import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[rgba(161,138,189,0.15)] bg-[rgba(12,10,14,0.95)]">
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-6">
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-8">
          <section>
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[rgba(220,210,235,0.6)]">
              Product
            </h3>
            <ul className="m-0 list-none p-0 [&_li]:mb-2 [&_a]:text-[0.9rem] [&_a]:text-[rgba(220,210,235,0.85)] [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-[#b8a0e8]">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/new-download-gate">Create Gate</Link></li>
              <li><Link to="/signup">Sign Up</Link></li>
            </ul>
          </section>
          <section>
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[rgba(220,210,235,0.6)]">
              Resources
            </h3>
            <ul className="m-0 list-none p-0 [&_li]:mb-2 [&_a]:text-[0.9rem] [&_a]:text-[rgba(220,210,235,0.85)] [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-[#b8a0e8]">
              <li>
                <a href="https://github.com/robin-lake/download-gate" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
              <li><Link to="/login">Log In</Link></li>
            </ul>
          </section>
          <section>
            <h3 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-[rgba(220,210,235,0.6)]">
              Legal
            </h3>
            <ul className="m-0 list-none p-0 [&_li]:mb-2 [&_a]:text-[0.9rem] [&_a]:text-[rgba(220,210,235,0.85)] [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-[#b8a0e8]">
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </section>
        </div>
        <div className="border-t border-[rgba(161,138,189,0.1)] pt-6">
          <span className="text-[0.8rem] tracking-wide text-[rgba(220,210,235,0.5)]">
            download gate · free for independent artists
          </span>
        </div>
      </div>
    </footer>
  );
}
