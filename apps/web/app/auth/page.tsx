"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../lib/auth";
import { signin, signup } from "../../lib/api";
import { StarBorder } from "../components/reactbits/star-border";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const modeTitle = useMemo(
    () => (mode === "signin" ? "Welcome back" : "Create your PingNova account"),
    [mode],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setMessage("Username and password are required.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        await signup({ username: username.trim(), password });
      }

      const result = await signin({ username: username.trim(), password });
      setToken(result.jwt);
      router.push("/dashboard");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Unable to complete authentication. Try again.";
      setMessage(nextMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-180px)] grid-cols-1 gap-5 p-6 md:grid-cols-2 md:p-10">
      <div className="flex flex-col justify-center">
        <span className="inline-flex w-fit rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          Access the Control Plane
        </span>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#f7f1e8] md:text-5xl">{modeTitle}</h1>
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

      <div className="rounded-[20px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl md:p-6">
        <div className="inline-flex rounded-full border border-white/12 bg-white/6 p-1" role="tablist" aria-label="Auth mode">
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signin" ? "bg-white text-zinc-900" : "text-[#ece3d7c7]"}`}
            onClick={() => setMode("signin")}
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
          >
            Sign In
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "signup" ? "bg-white text-zinc-900" : "text-[#ece3d7c7]"}`}
            onClick={() => setMode("signup")}
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
          >
            Sign Up
          </button>
        </div>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm text-[#ece3d7bf]" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="w-full rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-[#f7f1e8] outline-none transition placeholder:text-[#ece3d782] focus:border-[#f0cc9f88]"
            placeholder="e.g. ansh"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />

          <label className="block text-sm text-[#ece3d7bf]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="w-full rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-[#f7f1e8] outline-none transition placeholder:text-[#ece3d782] focus:border-[#f0cc9f88]"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          {message ? <p className="text-sm text-[#f27e70]">{message}</p> : null}

          <StarBorder
            as="button"
            type="submit"
            disabled={busy}
            color="#f0cc9f"
            speed="4.8s"
            thickness={1}
            className="w-full"
            innerClassName="w-full rounded-full bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] px-5 py-3 text-sm font-semibold text-[#17120e]"
          >
            {busy ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </StarBorder>
        </form>
      </div>
    </section>
  );
}
