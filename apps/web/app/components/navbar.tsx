
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", link: "/dashboard" },
  { name: "Monitor", link: "/monitor" },
  { name: "Features", link: "/#features" },
  { name: "Pricing", link: "/#pricing" },
  { name: "FAQ", link: "/#faq" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-40 mx-auto flex w-[min(1220px,calc(100vw-32px))] items-center justify-between gap-3 px-1 pt-2">
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0 px-2 text-sm font-semibold tracking-wide text-[#f7f1e8] hover:opacity-80 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#f27e70]">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        PingNova
      </Link>

      <div className="flex w-full flex-1 justify-center">
        <ResizableNavbar className="top-3">
          <NavBody className="min-w-0 bg-[#0d0d0d] border border-white/10 shadow-lg rounded-[24px]">
            <div className="hidden h-9 w-24 lg:block" aria-hidden="true" />
            <NavItems items={navItems} />
            <div className="hidden h-9 w-24 lg:block" aria-hidden="true" />
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
                Menu
              </span>
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </MobileNavHeader>

            <MobileNavMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            >
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <span className="block">{item.name}</span>
                </a>
              ))}
              <SignedOut>
                <NavbarButton
                  as={Link}
                  href="/auth"
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Open App
                </NavbarButton>
              </SignedOut>
            </MobileNavMenu>
          </MobileNav>
        </ResizableNavbar>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <SignedOut>
          <NavbarButton
            as={Link}
            href="/auth"
            variant="secondary"
            className="hidden lg:inline-flex"
          >
            Open App
          </NavbarButton>
        </SignedOut>
        <SignedIn>
          <div className="rounded-full border border-white/12 bg-[#111113] p-1">
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </header>
  );
}
