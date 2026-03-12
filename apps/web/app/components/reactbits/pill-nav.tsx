"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

type PillNavProps = {
  logo?: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
  logoText?: string;
};

export function PillNav({
  logo,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  ease = "power3.out",
  baseColor = "#f8fafc",
  pillColor = "rgba(255,255,255,0.08)",
  hoveredPillTextColor = "#f8fafc",
  pillTextColor = "rgba(248,250,252,0.88)",
  onMobileMenuClick,
  initialLoadAnimation = true,
  logoText,
}: PillNavProps) {
  const [animatedIn, setAnimatedIn] = useState(!initialLoadAnimation);

  useEffect(() => {
    if (!initialLoadAnimation) return;
    const id = window.setTimeout(() => setAnimatedIn(true), 20);
    return () => window.clearTimeout(id);
  }, [initialLoadAnimation]);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-full border border-white/15 px-3 py-2 backdrop-blur-xl transition-all duration-500 ${className}`}
      style={{ background: pillColor }}
    >
      <div className="flex items-center gap-2">
        {logo ? (
          <img src={logo} alt={logoAlt} className="h-7 w-7 rounded-full object-cover" />
        ) : logoText ? (
          <div className="grid h-7 w-24 place-items-center rounded-full bg-white/10 text-[15px] font-semibold text-white tracking-wide">
            {logoText}
          </div>
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
            PN
          </div>
        )}
      </div>

      <nav className="hidden items-center gap-1 md:flex justify-center" aria-label="Primary">
        {items.map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              data-pill-item
              key={item.label}
              href={item.href}
              aria-label={item.ariaLabel ?? item.label}
              className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                active ? "bg-white text-zinc-900" : "hover:bg-white/12"
              } ${animatedIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
              style={{
                color: active ? "#18181b" : pillTextColor,
                transitionTimingFunction:
                  ease === "power3.out" ? "cubic-bezier(0.22, 1, 0.36, 1)" : ease,
              }}
              onMouseEnter={(event) => {
                if (!active) {
                  event.currentTarget.style.color = hoveredPillTextColor;
                }
              }}
              onMouseLeave={(event) => {
                if (!active) {
                  event.currentTarget.style.color = pillTextColor;
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onMobileMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
        style={{ background: baseColor === "#f8fafc" ? "rgba(255,255,255,0.08)" : baseColor }}
        aria-label="Open mobile menu"
      >
        <span className="text-lg leading-none">≡</span>
      </button>
    </div>
  );
}
