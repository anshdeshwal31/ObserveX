import { Beams } from "../reactbits/beams";
import { StarBorder } from "../reactbits/star-border";

export function HeroSection() {
  return (
    <section className="relative min-h-[660px] overflow-hidden px-6 pb-14 pt-24 text-center md:px-10">
      <Beams
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
      />

      <button
        className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-white/8 p-3 text-white/90 backdrop-blur transition hover:border-white/35 hover:bg-white/12"
        aria-label="Watch demo"
      >
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
          <path d="M0 0v16l14-8L0 0z" />
        </svg>
      </button>

      <div className="relative z-10 mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-[#ece3d7cc] backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-[#f0cc9f]" />
        PingNova · Live Monitoring Active
        <span aria-hidden>&nbsp;→</span>
      </div>

      <h1 className="relative z-10 mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-[#f7f1e8] md:text-7xl">
        Monitor Every <br />
        <span className="bg-linear-to-r from-[#fff6ea] via-[#f2d5b6] to-[#f1bd90] bg-clip-text text-transparent">
          Millisecond
        </span>
      </h1>
      <p className="relative z-10 mx-auto mt-5 max-w-2xl text-lg text-[#ece3d7c7]">
        PingNova tracks uptime, response velocity, and outage trends with a calm,
        cinematic control panel built for teams that move fast.
      </p>

      <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
        <StarBorder
          as="a"
          href="/dashboard"
          color="#f0cc9f"
          speed="5s"
          thickness={1}
          innerClassName="rounded-full bg-white/8 px-5 py-3 text-sm font-semibold text-[#f7f1e8] backdrop-blur"
        >
          Open App <span aria-hidden>↗</span>
        </StarBorder>
        <StarBorder
          as="a"
          href="/auth"
          color="#f1bd90"
          speed="4.8s"
          thickness={1}
          innerClassName="rounded-full bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] px-5 py-3 text-sm font-semibold text-[#17120e]"
        >
          Get Started
        </StarBorder>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-24 top-36 z-0 grid grid-cols-3 opacity-40" aria-hidden="true">
        <span className="mx-auto h-full w-px bg-linear-to-b from-transparent via-white/20 to-transparent" />
        <span className="mx-auto h-full w-px bg-linear-to-b from-transparent via-white/12 to-transparent" />
        <span className="mx-auto h-full w-px bg-linear-to-b from-transparent via-white/20 to-transparent" />
      </div>

      <div className="pointer-events-none relative z-10 mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-3 text-left text-sm text-[#ece3d7c7] md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#f0cc9f]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 20 2 20" />
            </svg>
          </div>
          <p>Uptime</p>
          <span className="mt-1 block text-xl font-semibold text-[#f7f1e8]">99.9%</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#f0cc9f]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <p>Latency</p>
          <span className="mt-1 block text-xl font-semibold text-[#f7f1e8]">127 ms</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#f0cc9f]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </div>
          <p>Regions</p>
          <span className="mt-1 block text-xl font-semibold text-[#f7f1e8]">4</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#f0cc9f]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p>Incidents</p>
          <span className="mt-1 block text-xl font-semibold text-[#f7f1e8]">0</span>
        </div>
      </div>

      <div className="relative z-10 mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-[#ece3d7a1]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
        01/04 · Scroll down
      </div>

      <div className="relative z-10 mx-auto mt-8 flex w-fit items-center gap-3 text-sm text-[#ece3d7c7]">
        Website Health
        <span className="h-px w-20 bg-linear-to-r from-[#f0cc9f] to-transparent" />
      </div>
    </section>
  );
}
