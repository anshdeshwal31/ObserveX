export function Footer() {
  return (
    <footer className="mx-auto mt-8 w-[min(1220px,calc(100vw-32px))] border-t border-white/10 px-4 py-8">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* Brand */}
        <div className="flex items-center gap-2 text-sm font-semibold text-[#f7f1e8]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f27e70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          PingNova
          <span className="ml-2 text-xs font-normal text-[#ece3d7bf]">— Open source uptime monitoring</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-5">
          <a
            href="https://x.com/marcus_313131"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#ece3d7bf] transition hover:text-[#f7f1e8]"
            aria-label="Twitter / X"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>

          <a
            href="https://www.linkedin.com/in/anshdeshwal31/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#ece3d7bf] transition hover:text-[#f7f1e8]"
            aria-label="LinkedIn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>

          <a
            href="https://github.com/anshdeshwal31"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#ece3d7bf] transition hover:text-[#f7f1e8]"
            aria-label="GitHub"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>

          <a
            href="tel:9627660757"
            className="flex items-center gap-1.5 text-xs text-[#ece3d7bf] transition hover:text-[#f7f1e8]"
            aria-label="Contact Developer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.87 19.79 19.79 0 01.15 1.23 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.91-.91a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Contact Developer
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-[#ece3d7bf]/60">
          © {new Date().getFullYear()} PingNova
        </p>
      </div>
    </footer>
  );
}
