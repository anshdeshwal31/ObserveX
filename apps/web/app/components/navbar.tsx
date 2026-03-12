
import Link from "next/link";
import { PillNav } from "./reactbits/pill-nav";
import { StarBorder } from "./reactbits/star-border";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Monitors", href: "/dashboard" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  return (
    <header className="sticky top-4 z-40 mx-auto flex w-[min(1220px,calc(100vw-32px))] items-center justify-center gap-3 px-1">
      <PillNav
        logo={undefined}
        logoAlt="PingNova"
        items={navItems}
        activeHref="/"
        baseColor="#f8fafc"
        pillColor="rgba(9,9,11,0.72)"
        hoveredPillTextColor="#ffffff"
        pillTextColor="rgba(255,255,255,0.85)"
        className="w-full justify-center"
        initialLoadAnimation={false}
        logoText="PingNova"
      />
      <StarBorder
        as={Link}
        href="/auth"
        color="#f0cc9f"
        speed="5s"
        thickness={1}
        className="shrink-0"
        innerClassName="rounded-full bg-[#111113] px-4 py-2 text-sm font-semibold text-[#f7f1e8]"
      >
        Open App <span aria-hidden>→</span>
      </StarBorder>
    </header>
  );
}
