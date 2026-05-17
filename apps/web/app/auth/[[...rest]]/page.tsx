"use client";

import { useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { StarBorder } from "../components/reactbits/star-border";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <section className="grid min-h-[calc(100vh-180px)] grid-cols-1 gap-5 p-6 md:grid-cols-2 md:p-10">
      <div className="flex flex-col justify-center">
        <span className="inline-flex w-fit rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          Access the Control Plane
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">
          {mode === "signin" ? "Welcome back" : "Create your PingNova account"}
        </h1>
        <p className="mt-4 max-w-lg text-[#ece3d7bf]">
          Monitor availability, investigate outages, and protect your services from a
          single operational surface.
        </p>

        <div className="mt-8 w-full max-w-sm rounded-[20px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-[#ece3d7bf]">
            <span className="h-2 w-2 rounded-full bg-[#f0cc9f]" />
            <span>API Status</span>
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">99.8%</p>
          <span className="mt-1 block text-sm text-[#ece3d7a8]">Uptime · Last 30 days</span>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-[20px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl md:p-6">
        <div className="mb-6 inline-flex rounded-full border border-white/12 bg-white/6 p-1 w-full max-w-sm" role="tablist" aria-label="Auth mode">
          <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-white text-zinc-900" : "text-[#ece3d7c7] hover:text-white"}`}
            onClick={() => setMode("signin")}
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
          >
            Sign In
          </button>
          <button
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-white text-zinc-900" : "text-[#ece3d7c7] hover:text-white"}`}
            onClick={() => setMode("signup")}
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
          >
            Sign Up
          </button>
        </div>

        <div className="w-full flex justify-center [&_.cl-card]:bg-transparent [&_.cl-card]:border-0 [&_.cl-card]:shadow-none [&_.cl-headerTitle]:text-[#f7f1e8] [&_.cl-headerSubtitle]:text-[#ece3d7bf] [&_.cl-socialButtonsBlockButton]:bg-white/5 [&_.cl-socialButtonsBlockButton]:border-white/12 [&_.cl-socialButtonsBlockButtonText]:text-[#f7f1e8] [&_.cl-socialButtonsBlockButton:hover]:bg-white/10 [&_.cl-dividerLine]:bg-white/12 [&_.cl-dividerText]:text-[#ece3d782] [&_.cl-formFieldLabel]:text-[#ece3d7bf] [&_.cl-formFieldInput]:bg-white/5 [&_.cl-formFieldInput]:border-white/12 [&_.cl-formFieldInput]:text-[#f7f1e8] [&_.cl-footerActionText]:text-[#ece3d7bf] [&_.cl-footerActionLink]:text-[#f0cc9f] [&_.cl-formButtonPrimary]:bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] [&_.cl-formButtonPrimary]:text-[#17120e] [&_.cl-formButtonPrimary:hover]:opacity-90">
          {mode === "signin" ? (
            <SignIn routing="path" path="/auth" fallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/dashboard" />
          ) : (
            <SignUp routing="path" path="/auth" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard" />
          )}
        </div>
      </div>
    </section>
  );
}
