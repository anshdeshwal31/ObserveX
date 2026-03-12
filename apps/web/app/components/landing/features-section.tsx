"use client";

import { AnimateIn } from "../animate-in";

const features = [
  {
    title: "Global Checks",
    desc: "Run uptime and latency checks from multiple regions with minute-level cadence.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    title: "Fast Incident Context",
    desc: "See the latest failures, response spikes, and status transitions without switching tools.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Timeline Replay",
    desc: "Inspect each tick's status, response time, and region to isolate noisy endpoints quickly.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Actionable Dashboard",
    desc: "Track active monitors, incident count, and recent checks from one command center.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-[min(1120px,calc(100%-48px))] py-14">
      <header className="mb-9">
        <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          Features
        </span>
        <h2 className="mt-4 max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">
          Everything Your Ops Team Needs In One Surface
        </h2>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f, i) => (
          <article className="rounded-[20px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <div className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-[#f0cc9f]">
              {f.icon}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-[#f7f1e8]">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#ece3d7bf]">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
