"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { getWebsiteStatus, type WebsiteInfo, type WebsiteTick } from "../../../lib/api";

type TabKey = "regional" | "http" | "logs";

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function p95(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}

function uptimePct(ticks: WebsiteTick[]) {
  if (!ticks.length) return 100;
  const up = ticks.filter((t) => t.status === "Up").length;
  return Math.round((up / ticks.length) * 1000) / 10;
}

function formatTime(timestamp: string) {
  const iso = new Date(timestamp).toISOString();
  return iso.replace("T", " ").replace("Z", " UTC");
}

function workerForRegion(region: string) {
  const lower = region.toLowerCase();
  if (lower.startsWith("us") || lower.startsWith("usa")) return "us-1";
  if (lower.startsWith("eu")) return "eu-1";
  if (lower.startsWith("ap")) return "ap-1";
  return `${region}-1`;
}

function UptimeBar({ ticks }: { ticks: WebsiteTick[] }) {
  const visible = ticks.slice(0, 40);
  const maxMs = Math.max(...visible.map((t) => t.response_time_ms), 1);

  return (
    <div className="flex min-h-[52px] items-end gap-1.5">
      {visible.map((tick) => {
        const ratio = Math.min(tick.response_time_ms / maxMs, 1);
        const height = Math.max(ratio * 48, 4);
        return (
          <div
            key={tick.id}
            className={`w-2 rounded-sm ${tick.status === "Down" ? "bg-[#f27e70]" : "bg-[#f0cc9f]"}`}
            style={{ height: `${height}px` }}
            title={`${tick.response_time_ms} ms — ${tick.status}`}
          />
        );
      })}
    </div>
  );
}

export default function WebsiteDetailPage() {
  const params = useParams<{ websiteId: string }>();
  const websiteId = typeof params.websiteId === "string" ? params.websiteId : "";
  const { getToken, isLoaded, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<WebsiteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("regional");

  useEffect(() => {
    if (!isLoaded || !userId || !websiteId) return;

    async function load() {
      try {
        const token = await getToken();
        if (token) {
          const result = await getWebsiteStatus(websiteId, token);
          setWebsite(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to fetch website data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isLoaded, userId, websiteId, getToken]);

  const ticks = website?.ticks ?? [];
  const latencies = useMemo(() => ticks.filter((t) => t.response_time_ms >= 0).map((t) => t.response_time_ms), [ticks]);
  const averageLatency = useMemo(() => avg(latencies), [latencies]);
  const tailLatency = useMemo(() => p95(latencies), [latencies]);
  const uptime = useMemo(() => uptimePct(ticks), [ticks]);
  const peakLatency = useMemo(() => (latencies.length ? Math.max(...latencies) : 0), [latencies]);

  const regionStats = useMemo(() => {
    const grouped = new Map<string, WebsiteTick[]>();
    ticks.forEach((tick) => {
      const region = tick.region_id || "unknown";
      const list = grouped.get(region) ?? [];
      list.push(tick);
      grouped.set(region, list);
    });

    return Array.from(grouped.entries()).map(([region, groupTicks]) => {
      const regionLatencies = groupTicks.filter((t) => t.response_time_ms >= 0).map((t) => t.response_time_ms);
      const success = groupTicks.filter((t) => t.status === "Up").length;
      return {
        region,
        worker: workerForRegion(region),
        avg: regionLatencies.length ? avg(regionLatencies) : 0,
        successRate: groupTicks.length ? Math.round((success / groupTicks.length) * 1000) / 10 : 0,
      };
    });
  }, [ticks]);

  const signatureStats = useMemo(() => {
    const total = ticks.length;
    const up = ticks.filter((t) => t.status === "Up").length;
    const down = ticks.filter((t) => t.status === "Down").length;
    const timeout = ticks.filter((t) => t.response_time_ms === -1).length;
    return {
      total,
      upRate: total ? Math.round((up / total) * 1000) / 10 : 0,
      downRate: total ? Math.round((down / total) * 1000) / 10 : 0,
      timeout,
    };
  }, [ticks]);

  const logs = useMemo(() => {
    return [...ticks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((tick) => {
        const code = tick.status === "Up" ? "200 OK" : "503 ERR";
        const statusLabel = tick.status === "Up" ? "UP" : "ERR";
        const latency = tick.response_time_ms >= 0 ? `${tick.response_time_ms}ms` : "Connection Timeout";
        return {
          status: tick.status,
          line: `[${formatTime(tick.created_at)}] [${tick.region_id}] NODE: ${workerForRegion(tick.region_id)} | GET ${website?.url ?? ""} | ${code} | ${latency}`,
          label: statusLabel,
        };
      });
  }, [ticks, website?.url]);

  if (loading) {
    return (
      <section className="space-y-4 p-6 md:p-8">
        <article className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 text-[#ece3d7bf]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-[#f0cc9f]" />
            Loading website status...
          </div>
        </article>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4 p-6 md:p-8">
        <Link href="/dashboard" className="inline-flex text-sm text-[#ece3d7bf] hover:text-[#f7f1e8]">
          ← Back to Dashboard
        </Link>
        <article className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-[#f7f1e8]">Could not load website details</h2>
          <p className="mt-2 text-[#ece3d7bf]">{error}</p>
        </article>
      </section>
    );
  }

  if (!website) {
    return (
      <section className="space-y-4 p-6 md:p-8">
        <Link href="/dashboard" className="inline-flex text-sm text-[#ece3d7bf] hover:text-[#f7f1e8]">
          ← Back to Dashboard
        </Link>
        <article className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-[#f7f1e8]">Monitoring will begin shortly</h2>
          <p className="mt-2 text-[#ece3d7bf]">
            Website data is being collected. The first check result will appear here
            once the monitoring pipeline processes this endpoint.
          </p>
        </article>
      </section>
    );
  }

  return (
    <section className="space-y-5 p-6 md:p-8">
      <Link href="/dashboard" className="inline-flex text-sm text-[#ece3d7bf] hover:text-[#f7f1e8]">
        ← Back to Dashboard
      </Link>

      <header className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
              Endpoint Instance
            </span>
            <h1 className="mt-3 break-all text-3xl font-semibold tracking-[-0.03em] text-[#f7f1e8] md:text-4xl">{website.url}</h1>
            <p className="mt-1 text-sm text-[#ece3d7bf]">Endpoint ID: {website.id}</p>
          </div>
          <div className="grid w-full gap-3 md:w-auto md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
              <span className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">SLO Uptime</span>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{uptime}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
              <span className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">Mean Latency</span>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{averageLatency ? `${averageLatency} ms` : "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
              <span className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">P95 Tail</span>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{tailLatency ? `${tailLatency} ms` : "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-center">
              <span className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">Events Ingested</span>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{ticks.length}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <h2 className="text-xl font-semibold text-[#f7f1e8]">Ingress Latency Window (Last 40 checks)</h2>
        {ticks.length === 0 ? (
          <p className="mt-4 text-sm text-[#ece3d7bf]">No ingress events recorded yet.</p>
        ) : (
          <>
            <div className="mt-4">
              <UptimeBar ticks={ticks} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-[#ece3d7bf]">
              <span>Right edge is newest sample</span>
              <span>Peak Latency: {peakLatency} ms</span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {(
            [
              { key: "regional", label: "Regional SLO Matrix" },
              { key: "http", label: "HTTP Distribution" },
              { key: "logs", label: "Stream Trace Logs" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === item.key
                  ? "bg-white text-[#0b0b0b]"
                  : "text-[#ece3d7bf] hover:text-white"
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "regional" && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[#ece3d7bf]">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-3">Region ID</th>
                  <th className="py-2 pr-3">Worker Node</th>
                  <th className="py-2 pr-3">Mean Latency</th>
                  <th className="py-2">SLO Pass Rate</th>
                </tr>
              </thead>
              <tbody>
                {regionStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-[#ece3d7bf]">
                      No regional telemetry available yet.
                    </td>
                  </tr>
                ) : (
                  regionStats.map((region) => (
                    <tr key={region.region} className="border-b border-white/5 last:border-none">
                      <td className="py-2 pr-3 text-[#f7f1e8]">{region.region}</td>
                      <td className="py-2 pr-3 text-[#ece3d7bf]">{region.worker}</td>
                      <td className="py-2 pr-3 text-[#ece3d7bf]">{region.avg ? `${region.avg} ms` : "—"}</td>
                      <td className="py-2 text-[#ece3d7bf]">{region.successRate ? `${region.successRate}%` : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "http" && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">2xx Success Rate</p>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{signatureStats.total ? `${signatureStats.upRate}%` : "—"}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">5xx Error Rate</p>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{signatureStats.total ? `${signatureStats.downRate}%` : "—"}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[#ece3d7bf]">Timeout Events</p>
              <p className="mt-2 text-2xl font-semibold text-[#f7f1e8]">{signatureStats.timeout}</p>
            </article>
          </div>
        )}

        {tab === "logs" && (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0b0b0b] p-3 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-[#9b9487]">No stream traces recorded yet.</p>
            ) : (
              <div className="space-y-1">
                {logs.slice(0, 18).map((log, index) => (
                  <p
                    key={`${log.line}-${index}`}
                    className={log.status === "Down" ? "text-[#f27e70]" : "text-[#f0cc9f]"}
                  >
                    {log.line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
