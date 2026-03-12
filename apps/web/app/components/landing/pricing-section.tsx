"use client";

import { AnimateIn } from "../animate-in";
import { StarBorder } from "../reactbits/star-border";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    features: ["Up to 5 websites", "Basic status timeline", "Community support", "1 region"],
    highlighted: false,
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: ["Up to 100 websites", "Advanced tick history", "Priority support", "4 regions", "Incident alerts"],
    highlighted: true,
    cta: "Get Started",
    badge: "Most Popular",
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    features: ["Unlimited websites", "Dedicated throughput", "Custom SLAs", "All regions", "SSO & SAML"],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto w-[min(1120px,calc(100%-48px))] border-t border-white/10 py-14">
      <header className="mb-9">
        <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          Pricing
        </span>
        <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">
          Simple Plans, Serious Monitoring
        </h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, i) => (
          <article
            className={`rounded-[20px] border p-6 backdrop-blur-xl ${
              plan.highlighted
                ? "border-[#f0cc9f66] bg-[#f0cc9f14]"
                : "border-white/10 bg-white/6"
            }`}
          >
            {plan.badge && (
              <span className="inline-flex rounded-full border border-[#f0cc9f55] bg-[#f0cc9f1a] px-2.5 py-1 text-xs font-semibold text-[#f0cc9f]">
                {plan.badge}
              </span>
            )}
            <h3 className="mt-4 text-xl font-semibold text-[#f7f1e8]">{plan.name}</h3>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">
              {plan.price}
              {plan.period && <span className="ml-1 text-base text-[#ece3d7b8]">{plan.period}</span>}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[#ece3d7bf]">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0 text-[#f0cc9f]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a
                href="/auth"
                className={`w-full rounded-full px-5 py-3 text-center text-sm font-semibold ${
                  plan.highlighted
                    ? "bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] text-[#17120e]"
                    : "bg-white/8 text-[#f7f1e8]"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
