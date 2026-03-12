import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { Navbar } from "./components/navbar";
import "./globals.css";

const displayFont = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-custom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PingNova | One-click Asset Defense",
  description:
    "PingNova monitors your websites with a modern control surface for uptime and response health.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${monoFont.variable} min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_78%_20%,rgba(247,234,216,0.24),transparent_36%),radial-gradient(circle_at_8%_84%,rgba(246,180,133,0.2),transparent_30%),linear-gradient(180deg,#0a0a09_0%,#050505_100%)] font-(--font-display) text-[#f7f1e8]`}
      >
        <div className="min-h-screen px-2.5 pb-6 pt-2 md:px-4 md:pt-3">
          <Navbar />
          <main className="relative mx-auto mt-3 w-[min(1220px,calc(100vw-32px))] overflow-hidden rounded-[26px] border border-white/15 bg-[#040404] shadow-[0_26px_58px_rgba(0,0,0,0.52)] md:rounded-4xl">
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 12%, rgba(249, 236, 220, 0.2), transparent 28%), radial-gradient(circle at 14% 90%, rgba(245, 175, 126, 0.18), transparent 34%), radial-gradient(rgba(255,255,255,0.08) 0.6px, transparent 0.7px)",
                backgroundSize: "auto, auto, 3px 3px",
                opacity: 0.9,
              }}
            />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
