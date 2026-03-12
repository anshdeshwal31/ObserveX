"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getWebsiteStatus, type WebsiteInfo, type WebsiteTick } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<WebsiteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth");
      return;
    }

    if (!websiteId) {
      setError("Website ID is missing from the route.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const result = await getWebsiteStatus(websiteId);
        setWebsite(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to fetch website data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [websiteId, router]);

  const latestTick = useMemo(() => website?.ticks?.[0] ?? null, [website]);

  const uptimePct = useMemo(() => {
    if (!website?.ticks?.length) return 0;
    const up = website.ticks.filter((t) => t.status === "Up").length;
    return Math.round((up / website.ticks.length) * 1000) / 10;
  }, [website]);

  const avgResponse = useMemo(() => {
    if (!website?.ticks?.length) return 0;
    const sum = website.ticks.reduce((a, t) => a + t.response_time_ms, 0);
    return Math.round(sum / website.ticks.length);
  }, [website]);

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

      <header className="flex flex-col items-start justify-between gap-4 rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl md:flex-row md:items-center">
        <div>
          <span className="inline-flex rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#ece3d7c7]">
            Website Detail
          </span>
          <h1 className="mt-3 break-all text-3xl font-semibold tracking-[-0.03em] text-[#f7f1e8] md:text-4xl">{website.url}</h1>
          <p className="mt-1 text-sm text-[#ece3d7bf]">ID: {website.id}</p>
        </div>
        <div className="text-right">
          {latestTick?.status === "Up" ? (
            <span className="rounded-full bg-[linear-gradient(120deg,#f4dfc4,#ecbe8c)] px-3 py-1 text-xs font-semibold text-[#1d1205]">Up</span>
          ) : latestTick?.status === "Down" ? (
            <span className="rounded-full border border-[#f27e7080] bg-[#f27e704d] px-3 py-1 text-xs font-semibold text-[#fbe6df]">Down</span>
          ) : (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-[#ece3d7bf]">Unknown</span>
          )}
          <p className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#f7f1e8]">{uptimePct}%</p>
          <span className="text-sm text-[#ece3d7bf]">uptime</span>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Uptime</h3>
          <p className="mt-1 text-2xl font-semibold text-[#f7f1e8]">{uptimePct}%</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Avg Response</h3>
          <p className="mt-1 text-2xl font-semibold text-[#f7f1e8]">{avgResponse > 0 ? `${avgResponse} ms` : "—"}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Last Check</h3>
          <p className="mt-1 text-2xl font-semibold text-[#f7f1e8]">
            {latestTick?.created_at
              ? new Date(latestTick.created_at).toLocaleTimeString()
              : "—"}
          </p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
          <h3 className="text-sm text-[#ece3d7bf]">Total Checks</h3>
          <p className="mt-1 text-2xl font-semibold text-[#f7f1e8]">{website.ticks.length}</p>
        </article>
      </section>

      {website.ticks.length > 0 && (
        <section className="rounded-[20px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-[#f7f1e8]">Response Time — Last {Math.min(website.ticks.length, 40)} Checks</h2>
          <UptimeBar ticks={website.ticks} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-[#f7f1e8]">Recent Checks</h2>
        {website.ticks.length === 0 ? (
          <article className="rounded-[20px] border border-white/12 bg-white/8 p-6 text-[#ece3d7bf] backdrop-blur-xl">
            No checks are available yet. The producer/consumer pipeline may still be
            processing.
          </article>
        ) : (
          <div className="space-y-2">
            {website.ticks.map((tick) => (
              <article
                key={tick.id}
                className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-xl md:flex-row md:items-center"
              >
                <div>
                  <p className="text-[#f7f1e8]">{new Date(tick.created_at).toLocaleString()}</p>
                  <span className="text-sm text-[#ece3d7bf]">Region: {tick.region_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#ece3d7bf]">
                    {tick.response_time_ms >= 0
                      ? `${tick.response_time_ms} ms`
                      : "Timed out"}
                  </span>
                  {tick.status === "Up" ? (
                    <span className="rounded-full bg-[linear-gradient(120deg,#f4dfc4,#ecbe8c)] px-3 py-1 text-xs font-semibold text-[#1d1205]">Up</span>
                  ) : tick.status === "Down" ? (
                    <span className="rounded-full border border-[#f27e7080] bg-[#f27e704d] px-3 py-1 text-xs font-semibold text-[#fbe6df]">Down</span>
                  ) : (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-[#ece3d7bf]">Unknown</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
