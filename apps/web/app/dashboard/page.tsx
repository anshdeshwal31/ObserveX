"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { addWebsite, getWebsites, getWebsiteStatus, type WebsiteInfo } from "../../lib/api";
import { StarBorder } from "../components/reactbits/star-border";

type StatusMap = Record<string, { status: "Up" | "Down" | "Unknown"; responseMs?: number }>;
type DetailMap = Record<string, WebsiteInfo>;

function formatPct(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

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

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [websites, setWebsites] = useState<WebsiteInfo[]>([]);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [details, setDetails] = useState<DetailMap>({});
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
      } catch {
        setMessage("Could not load your websites. Please refresh.");
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
      }),
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

      const result = await addWebsite(url.trim(), token);
      const newSite: WebsiteInfo = {
        id: result.id,
        url: url.trim(),
        user_id: userId || "",
        time_added: new Date().toISOString(),
        ticks: [],
      };
      setWebsites((prev) => [newSite, ...prev]);
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

  const allTicks = useMemo(() => {
    return Object.values(details).flatMap((site) => site.ticks);
  }, [details]);

  const allLatencies = useMemo(
    () => allTicks.filter((tick) => tick.response_time_ms >= 0).map((tick) => tick.response_time_ms),
    [allTicks],
  );

  const globalUptime = useMemo(() => uptimePct(allTicks), [allTicks]);
  const globalP95 = useMemo(() => p95(allLatencies), [allLatencies]);
  const lastIngestAt = useMemo(() => {
    if (!allTicks.length) return null;
    return allTicks.reduce((latest, tick) =>
      new Date(tick.created_at).getTime() > new Date(latest.created_at).getTime() ? tick : latest,
    ).created_at;
  }, [allTicks]);
  const activeRegions = useMemo(() => {
    const regionSet = new Set<string>();
    allTicks.forEach((tick) => regionSet.add(tick.region_id || "usa"));
    return Array.from(regionSet.values());
  }, [allTicks]);

  const ingressLogs = useMemo(() => {
    const entries = Object.values(details).flatMap((site) =>
      site.ticks.map((tick) => ({
        tick,
        websiteId: site.id,
      }))
    );

    if (entries.length === 0) return [] as Array<{ line: string; status: "Up" | "Down" | "Unknown" }>

    return entries
      .sort((a, b) => new Date(b.tick.created_at).getTime() - new Date(a.tick.created_at).getTime())
      .slice(0, 8)
      .map(({ tick, websiteId }) => {
        const label = tick.status === "Up" ? "OK" : tick.status === "Down" ? "ERR" : "UNK";
        const region = tick.region_id || "usa";
        const latency = tick.response_time_ms >= 0 ? `${tick.response_time_ms}ms` : "Timeout";
        const code = tick.status === "Up" ? "200 OK" : "503 ERR";
        return {
          status: tick.status,
          line: `[${label}] [${region}] INGESTED website_id:${websiteId.slice(0, 6)} ${code} (${latency})`,
        };
      });
  }, [details]);

  return (
    <section className="space-y-5 p-6 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
            Mission Control
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">SRE Command Center</h1>
          <p className="mt-2 text-[#ece3d7bf]">Multi-region ingestion, SLO posture, and broker telemetry at a glance.</p>
        </div>
        <StarBorder
          as="button"
          type="button"
          thickness={1}
          innerClassName="rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-[#f7f1e8]"
        >
          Operator Console
        </StarBorder>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-[#ece3d7bf]">Total Endpoints</h3>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{websites.length}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-[#ece3d7bf]">Global Service Uptime</h3>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#f7f1e8]">{formatPct(globalUptime)}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-[#ece3d7bf]">P95 Ingest Latency</h3>
          <p className="mt-2 text-lg font-semibold text-[#f7f1e8]">{allLatencies.length ? `${globalP95} ms` : "—"}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
          <h3 className="text-[11px] uppercase tracking-[0.14em] text-[#ece3d7bf]">Last Ingest (UTC)</h3>
          <p className="mt-2 text-lg font-semibold text-[#f7f1e8]">{lastIngestAt ? formatTimestamp(lastIngestAt) : "—"}</p>
        </article>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#f7f1e8]">Endpoint Reliability Matrix</h2>
            <span className="text-xs text-[#ece3d7bf]">Last checks • multi-region</span>
          </div>

          <div className="mt-4 overflow-x-auto">
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
                    const latencies = ticks.filter((t) => t.response_time_ms >= 0).map((t) => t.response_time_ms);
                    const p95Latency = latencies.length ? `${p95(latencies)} ms` : "— ms";
                    const lastTick = ticks.length
                      ? ticks.reduce((latest, tick) =>
                          new Date(tick.created_at).getTime() > new Date(latest.created_at).getTime() ? tick : latest,
                        )
                      : null;
                    const status = lastTick?.status ?? statuses[website.id]?.status ?? "Unknown";
                    const uptimeValue = ticks.length ? formatPct(uptimePct(ticks)) : "—";
                    const lastCheck = lastTick ? formatTimestamp(lastTick.created_at) : "—";

                    const badgeColor = status === "Up"
                      ? "border-[#f0cc9f55] text-[#f9e7cd]"
                      : status === "Down"
                        ? "border-[#f27e7080] text-[#fbe6df]"
                        : "border-white/20 text-[#ece3d7bf]";

                    const dotColor = status === "Up"
                      ? "bg-[#f0cc9f]"
                      : status === "Down"
                        ? "bg-[#f27e70]"
                        : "bg-white/40";

                    return (
                      <tr key={website.id} className="border-b border-white/5 last:border-none">
                        <td className="py-3 pr-3">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
                            <span className={`h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 pr-3 max-w-[320px]">
                          <p className="truncate text-sm font-semibold text-[#f7f1e8]">{website.url}</p>
                        </td>
                        <td className="py-3 pr-3 text-[#ece3d7bf]">{p95Latency}</td>
                        <td className="py-3 pr-3 text-[#ece3d7bf]">{uptimeValue}</td>
                        <td className="py-3 pr-3 text-[#ece3d7bf]">{lastCheck}</td>
                        <td className="py-3 text-[#f0cc9f]">
                          <Link href={`/website/${website.id}`} className="text-sm font-semibold hover:underline">
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

        <section className="space-y-4">
          <article className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[#f7f1e8]">Ingest New Endpoint</h2>
            <form onSubmit={onAddWebsite} className="mt-3 flex flex-col gap-3">
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
                thickness={1}
                innerClassName="rounded-full bg-[linear-gradient(130deg,#fff7ec,#f2d5b6_58%,#f1bd90)] px-5 py-3 text-sm font-semibold text-[#17120e]"
              >
                {saving ? "Adding..." : "Track Website"}
              </StarBorder>
            </form>
            {message ? <p className="mt-3 text-sm text-[#ece3d7bf]">{message}</p> : null}
          </article>

          <article className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[#f7f1e8]">Pipeline Telemetry</h2>
            <div className="mt-3 grid gap-2 text-sm text-[#ece3d7bf]">
              <div className="flex items-center justify-between">
                <span>Stream Broker</span>
                <span className="text-[#f7f1e8]">pingNova:website</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Consumer Group</span>
                <span className="text-[#f7f1e8]">usa</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Regions</span>
                <span className="text-[#f7f1e8]">{activeRegions.length ? activeRegions.join(", ") : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Ingest</span>
                <span className="text-[#f7f1e8]">{lastIngestAt ? formatTimestamp(lastIngestAt) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Events Ingested</span>
                <span className="text-[#f7f1e8]">{allTicks.length}</span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-[#f7f1e8]">Real-Time Stream Ingress</h2>
            <div className="mt-3 rounded-xl border border-white/10 bg-[#0b0b0b] p-3 font-mono text-xs text-[#d9d2c4]">
              {ingressLogs.length === 0 ? (
                <p className="text-[#9b9487]">Stream idle — awaiting first ingress events.</p>
              ) : (
                <div className="space-y-1">
                  {ingressLogs.map((log, index) => (
                    <p
                      key={`${log.line}-${index}`}
                      className={log.status === "Down" ? "text-[#f27e70]" : log.status === "Up" ? "text-[#f0cc9f]" : "text-[#ece3d7bf]"}
                    >
                      {log.line}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
