"use client";

import { AnimateIn } from "../animate-in";

const steps = [
  { num: "01", title: "Add Website", desc: "Paste a URL in the dashboard and start tracking immediately." },
  { num: "02", title: "Run Checks", desc: "PingNova captures status and response time continuously across regions." },
  { num: "03", title: "Investigate Faster", desc: "Open per-website detail pages to debug spikes and downtime patterns." },
];

export function WorkflowSection() {
  return (
    <section className="mx-auto w-[min(1120px,calc(100%-48px))] border-t border-white/10 py-14">
      <header className="mb-9">
        <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          How It Works
        </span>
        <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">
          Set It Up In Minutes
        </h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => (
          <div className="relative">
            <article className="rounded-[20px] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
              <span className="inline-flex rounded-full border border-[#f0cc9f55] bg-[#f0cc9f1a] px-2.5 py-1 text-xs font-semibold text-[#f0cc9f]">
                {step.num}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-[#f7f1e8]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#ece3d7bf]">{step.desc}</p>
            </article>
            {i < steps.length - 1 && (
              <span className="pointer-events-none absolute -right-3.5 top-1/2 hidden -translate-y-1/2 text-xl text-[#ece3d759] md:block">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
