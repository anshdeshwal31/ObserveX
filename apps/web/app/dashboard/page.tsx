"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addWebsite, getWebsiteStatus } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth";
import { StarBorder } from "../components/reactbits/star-border";

const STORAGE_KEY = "pn_websites";

type LocalWebsite = {
  id: string;
  url: string;
  createdAt: string;
};

type StatusMap = Record<string, { status: "Up" | "Down" | "Unknown"; responseMs?: number }>;

function loadWebsites(): LocalWebsite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalWebsite[]) : [];
  } catch {
    return [];
  }
}

function saveWebsites(list: LocalWebsite[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [websites, setWebsites] = useState<LocalWebsite[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth");
      return;
    }
    setWebsites(loadWebsites());
  }, [router]);

  const fetchStatuses = useCallback(async (sites: LocalWebsite[]) => {
    const results: StatusMap = {};
    await Promise.allSettled(
      sites.map(async (site) => {
        try {
          const info = await getWebsiteStatus(site.id);
          const tick = info?.ticks?.[0];
          results[site.id] = {
            status: (tick?.status as "Up" | "Down") ?? "Unknown",
            responseMs: tick?.response_time_ms,
          };
        } catch {
          results[site.id] = { status: "Unknown" };
        }
      }),
    );
    setStatuses(results);
  }, []);

  useEffect(() => {
    if (websites.length > 0) {
      void fetchStatuses(websites);
    }
  }, [websites, fetchStatuses]);

  async function onAddWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setMessage("Please enter a website URL.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await addWebsite(url.trim());
      const next: LocalWebsite[] = [
        {
          id: result.id,
          url: url.trim(),
          createdAt: new Date().toISOString(),
        },
        ...websites,
      ];
      setWebsites(next);
      saveWebsites(next);
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

  function onSignOut() {
    clearToken();
    window.localStorage.removeItem(STORAGE_KEY);
    router.push("/auth");
  }

  const upCount = Object.values(statuses).filter((s) => s.status === "Up").length;
  const downCount = Object.values(statuses).filter((s) => s.status === "Down").length;

  return (
    <section className="space-y-5 p-6 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
            Mission Control
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">Tracking Dashboard</h1>
          <p className="mt-2 text-[#ece3d7bf]">Monitor, manage and inspect every endpoint from one surface.</p>
        </div>
        <StarBorder
          as="button"
          onClick={onSignOut}
          type="button"
          color="#ffffff"
          speed="6s"
          thickness={1}
          innerClassName="rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-[#f7f1e8]"
        >
          Sign Out
        </StarBorder>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Total Websites</h3>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{websites.length}</p>
        </article>
        <article className="rounded-2xl border border-[#f0cc9f55] bg-[#f0cc9f14] p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Active (Up)</h3>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{upCount}</p>
        </article>
        <article className="rounded-2xl border border-[#f27e7055] bg-[#f27e7014] p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Incidents (Down)</h3>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{downCount}</p>
        </article>
      </div>

      <article className="rounded-[20px] border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-[#f7f1e8]">Track a New Website</h2>
        <form onSubmit={onAddWebsite} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="w-full rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-[#f7f1e8] outline-none transition placeholder:text-[#ece3d782] focus:border-[#f0cc9f88]"
          />
          <StarBorder
            as="button"
            disabled={saving}
            type="submit"
            color="#f0cc9f"
            speed="4.8s"
            thickness={1}
            innerClassName="rounded-full bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] px-5 py-3 text-sm font-semibold text-[#17120e]"
          >
            {saving ? "Adding..." : "Track Website"}
          </StarBorder>
        </form>
        {message ? <p className="mt-3 text-sm text-[#ece3d7bf]">{message}</p> : null}
      </article>

      <div className="space-y-3">
        {websites.length === 0 ? (
          <article className="grid place-items-center rounded-[20px] border border-white/12 bg-white/8 p-7 text-center backdrop-blur-xl">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 text-[#ece3d78f]"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 className="text-xl font-semibold text-[#f7f1e8]">No websites tracked yet</h3>
            <p className="mt-2 max-w-xl text-[#ece3d7bf]">
              Add a website URL above to begin monitoring its uptime and response time.
            </p>
          </article>
        ) : (
          websites.map((website) => {
            const s = statuses[website.id];
            const statusClass = s?.status === "Up"
              ? "border-[#f0cc9f55]"
              : s?.status === "Down"
                ? "border-[#f27e7055]"
                : "border-white/12";

            return (
              <article
                key={website.id}
                className={`flex flex-col items-start justify-between gap-3 rounded-2xl border bg-white/8 p-4 backdrop-blur-xl md:flex-row md:items-center ${statusClass}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                      s?.status === "Up"
                        ? "bg-[#f0cc9f]"
                        : s?.status === "Down"
                          ? "bg-[#f27e70]"
                          : "bg-white/40"
                    }`}
                  />
                  <div>
                    <p className="text-base font-medium text-[#f7f1e8]">{website.url}</p>
                    <div className="mt-1 flex items-center gap-3 text-sm text-[#ece3d7bf]">
                      <span>{new Date(website.createdAt).toLocaleDateString()}</span>
                      {s?.responseMs !== undefined && (
                        <span>{s.responseMs} ms</span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/website/${website.id}`}
                  className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-[#f7f1e8]"
                >
                  View Details →
                </Link>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
