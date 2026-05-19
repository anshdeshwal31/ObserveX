"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { addWebsite } from "../../lib/api";

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [openAfter, setOpenAfter] = useState("");
  const [resolveAfter, setResolveAfter] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { getToken } = useAuth();

  async function onAddWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setMessage("Please enter a website URL.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed.");

      const openValue = openAfter.trim() === "" ? undefined : Number(openAfter);
      const resolveValue = resolveAfter.trim() === "" ? undefined : Number(resolveAfter);

      await addWebsite(url.trim(), token, {
        incident_open_after: Number.isFinite(openValue) ? openValue : undefined,
        incident_resolve_after: Number.isFinite(resolveValue) ? resolveValue : undefined,
      });

      setUrl("");
      setMessage("Website added. Monitoring will begin shortly.");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Could not add website right now. Please retry.";
      setMessage(nextMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 p-6 md:p-8">
      <header>
        <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
          Control Console
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">Add a new website</h1>
        <p className="mt-2 text-[#ece3d7bf]">
          Register an endpoint and define how sensitive incidents should be for this website.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onAddWebsite} className="space-y-4 rounded-2xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
          <div>
            <label className="block text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">
              Endpoint URL
            </label>
            <div className="mt-2 rounded-2xl border border-white/12 bg-[#0d0d0d] p-3">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://api.company.com/health"
                className="w-full bg-transparent text-sm text-[#f7f1e8] placeholder:text-[#ece3d7a0] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">
                Incident open after (Down)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={openAfter}
                onChange={(event) => setOpenAfter(event.target.value)}
                placeholder="3 (default)"
                className="mt-2 w-full rounded-2xl border border-white/12 bg-[#0d0d0d] px-4 py-3 text-sm text-[#f7f1e8] placeholder:text-[#ece3d7a0] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">
                Incident resolve after (Up)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={resolveAfter}
                onChange={(event) => setResolveAfter(event.target.value)}
                placeholder="2 (default)"
                className="mt-2 w-full rounded-2xl border border-white/12 bg-[#0d0d0d] px-4 py-3 text-sm text-[#f7f1e8] placeholder:text-[#ece3d7a0] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-[#f7f1e8] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Registering…" : "Start Monitoring"}
          </button>
          {message && <p className="text-xs text-[#f0cc9f]">{message}</p>}
        </form>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[#f7f1e8]">Incident sensitivity guide</h2>
            <p className="mt-2 text-sm text-[#ece3d7bf]">
              <span className="text-[#f7f1e8]">Low values</span> detect outages fast but can create noise from
              short blips. <span className="text-[#f7f1e8]">High values</span> reduce false alerts but delay
              detection or resolution.
            </p>
            <div className="mt-4 grid gap-3 text-xs text-[#ece3d7bf]">
              <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-3">
                <p className="font-semibold text-[#f7f1e8]">Open After (Down checks)</p>
                <p className="mt-1">Low = faster alerts. High = safer, slower alerts.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0b0b0b] p-3">
                <p className="font-semibold text-[#f7f1e8]">Resolve After (Up checks)</p>
                <p className="mt-1">Low = faster recovery. High = fewer flaps.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[#f7f1e8]">How PingNova decides</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#ece3d7bf]">
              <li>Each monitor check produces a tick with status and latency.</li>
              <li>Incidents open after consecutive Down ticks meet your threshold.</li>
              <li>Incidents resolve after consecutive Up ticks meet your threshold.</li>
              <li>Multi-region checks reduce single-node noise before alerts fire.</li>
            </ul>
          </section>
        </div>
      </section>
    </section>
  );
}
