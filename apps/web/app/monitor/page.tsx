"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { getWebsites, getWebsiteStatus, type WebsiteInfo } from "../../lib/api";

type StatusMap = Record<string, { status: "Up" | "Down" | "Unknown"; responseMs?: number }>;

function formatTimestamp(timestamp: string) {
  const iso = new Date(timestamp).toISOString();
  return iso.replace("T", " ").replace("Z", " UTC");
}

function p95(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}

function uptimePct(ticks: WebsiteInfo["ticks"]) {
  if (!ticks.length) return 100;
  const up = ticks.filter((t) => t.status === "Up").length;
  return Math.round((up / ticks.length) * 1000) / 10;
}

export default function MonitorPage() {
  const [websites, setWebsites] = useState<WebsiteInfo[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [details, setDetails] = useState<Record<string, WebsiteInfo>>({});
  const [loadingWebsites, setLoadingWebsites] = useState(true);
  const { getToken, isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const sites = await getWebsites(token);
          setWebsites(sites);
        }
      } finally {
        setLoadingWebsites(false);
      }
    })();
  }, [isLoaded, userId, getToken]);

  const fetchStatuses = useCallback(async (sites: WebsiteInfo[]) => {
    const token = await getToken();
    if (!token) return;

    const results: StatusMap = {};
    const detailEntries: Array<[string, WebsiteInfo]> = [];

    await Promise.allSettled(
      sites.map(async (site) => {
        try {
          const info = await getWebsiteStatus(site.id, token);
          const tick = info?.ticks?.[0];
          results[site.id] = {
            status: (tick?.status as "Up" | "Down") ?? "Unknown",
            responseMs: tick?.response_time_ms,
          };
          if (info) {
            detailEntries.push([site.id, info]);
          }
        } catch {
          results[site.id] = { status: "Unknown" };
        }
      })
    );

    setStatuses(results);
    if (detailEntries.length) {
      setDetails((prev) => ({ ...prev, ...Object.fromEntries(detailEntries) }));
    }
  }, [getToken]);

  useEffect(() => {
    if (websites.length > 0) {
      void fetchStatuses(websites);
    }
  }, [websites, fetchStatuses]);

  return (
    <section className="space-y-5 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
            Monitor
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">
            Endpoint Reliability Matrix
          </h1>
        </div>
        <span className="text-xs text-[#ece3d7bf]">Last checks • multi-region</span>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.12em] text-[#ece3d7bf]">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Monitored Endpoint</th>
                <th className="py-3 pr-3">P95 Latency</th>
                <th className="py-3 pr-3">Uptime %</th>
                <th className="py-3 pr-3">Last Check</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-[#f7f1e8]">
              {loadingWebsites ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#ece3d7bf]">
                    Loading endpoints...
                  </td>
                </tr>
              ) : websites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#ece3d7bf]">
                    No endpoints registered yet. Add one in the control console.
                  </td>
                </tr>
              ) : (
                websites.map((website) => {
                  const detail = details[website.id];
                  const ticks = detail?.ticks ?? [];
                  const latencies = ticks
                    .filter((t) => t.response_time_ms >= 0)
                    .map((t) => t.response_time_ms);
                  const p95Latency = latencies.length ? `${p95(latencies)} ms` : "— ms";
                  const uptime = ticks.length ? `${uptimePct(ticks)}%` : "—";
                  const lastTick = ticks[0];
                  const status = statuses[website.id]?.status ?? "Unknown";

                  return (
                    <tr key={website.id} className="border-b border-white/5 last:border-none">
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                            status === "Up"
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                              : status === "Down"
                              ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                              : "border-white/20 bg-white/5 text-[#ece3d7bf]"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              status === "Up"
                                ? "bg-emerald-400"
                                : status === "Down"
                                ? "bg-rose-400"
                                : "bg-white/40"
                            }`}
                          />
                          {status}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-sm font-semibold text-[#f7f1e8]">{website.url}</div>
                        <div className="text-xs text-[#ece3d7bf]">{website.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-3 pr-3 text-[#ece3d7bf]">{p95Latency}</td>
                      <td className="py-3 pr-3 text-[#ece3d7bf]">{uptime}</td>
                      <td className="py-3 pr-3 text-[#ece3d7bf]">
                        {lastTick ? formatTimestamp(lastTick.created_at) : "—"}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/website/${website.id}`}
                          className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-[#f7f1e8]"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
