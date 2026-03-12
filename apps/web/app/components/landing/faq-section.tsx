"use client";

import { useState } from "react";
import { AnimateIn } from "../animate-in";

const faqs = [
  { q: "How quickly do checks start?", a: "Usually within seconds of adding a website from the dashboard. Our pipeline picks up new monitors almost instantly." },
  { q: "Can I view historical status?", a: "Yes. Website detail pages show recent checks with full response-time and region context for each tick." },
  { q: "Do I need to install anything?", a: "No agent install is required. PingNova monitors via standard HTTP checks from our distributed infrastructure." },
  { q: "Is this suitable for production systems?", a: "Absolutely — that is the primary use case. Configure check intervals and alerting to match your SLA requirements." },
  { q: "What regions are supported?", a: "We currently support 4 monitoring regions with plans to expand. Pro and Scale plans unlock all available regions." },
  { q: "Can I export my monitoring data?", a: "Yes, all tick data is accessible via the API. Export as JSON for integration with your existing observability stack." },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 backdrop-blur-xl">
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-[#f7f1e8]"
        onClick={() => setOpen(!open)}
        type="button"
        aria-expanded={open}
      >
        {q}
        <span className="shrink-0">▼</span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0.6,
        }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-[#ece3d7bf]">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-[min(1120px,calc(100%-48px))] border-t border-white/10 py-14">
      <AnimateIn>
        <header className="mb-9">
          <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
            FAQ
          </span>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">
            Questions Teams Ask Before Switching
          </h2>
        </header>
      </AnimateIn>
      <div className="grid gap-2">
        {faqs.map((faq, i) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
        ))}
      </div>
    </section>
  );
}
