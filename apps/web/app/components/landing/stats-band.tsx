"use client";

import { AnimateIn } from "../animate-in";

const stats = [
  { label: "Websites Monitored", value: "1,240+" },
  { label: "Incidents Resolved", value: "97%" },
  { label: "Median Response", value: "124ms" },
];

export function StatsBand() {
  return (
    <section className="mx-auto grid w-[min(1120px,calc(100%-48px))] grid-cols-1 gap-4 px-0 py-12 md:grid-cols-3">
      {stats.map((stat, i) => (
        <AnimateIn key={stat.label} delay={i * 100}>
          <article className="rounded-[20px] border border-white/10 bg-white/6 p-7 backdrop-blur-xl transition hover:border-white/20">
            <p className="text-sm text-[#ece3d7b8]">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{stat.value}</p>
          </article>
        </AnimateIn>
      ))}
    </section>
  );
}
