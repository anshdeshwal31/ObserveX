import { createClient } from "redis";
import { prisma } from "@repo/db";
import { notifyIncidentOpened, notifyIncidentResolved } from "./incidentNotify";

const STREAM_KEY = "pingNova:websiteResponse";
const GROUP_NAME = "usa";
const CONSUMER_NAME = "us-1";
const DEFAULT_OPEN_AFTER = Number.parseInt(process.env.INCIDENT_OPEN_AFTER || "3", 10);
const DEFAULT_RESOLVE_AFTER = Number.parseInt(process.env.INCIDENT_RESOLVE_AFTER || "2", 10);
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 10;

function clampThreshold(value: number) {
  if (!Number.isFinite(value)) return MIN_THRESHOLD;
  const integer = Math.floor(value);
  if (integer < MIN_THRESHOLD) return MIN_THRESHOLD;
  if (integer > MAX_THRESHOLD) return MAX_THRESHOLD;
  return integer;
}

function normalizeThreshold(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number") return clampThreshold(fallback);
  return clampThreshold(value);
}

async function ensureGroup(client: ReturnType<typeof createClient>) {
  try {
    await client.xGroupCreate(STREAM_KEY, GROUP_NAME, "0", {
      MKSTREAM: true
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("BUSYGROUP")) throw e;
  }
}

type WebsiteStatus = "Up" | "Down" | "Unknown";

interface WebsiteTypeFromStream2 {
  id: string;
  message: {
    websiteUrl: string;
    websiteId: string;
    status: WebsiteStatus;
    response_time_ms: string;
    region_id: string;
  };
}

function hasConsecutiveStatus(
  ticks: Array<{ status: WebsiteStatus }>,
  count: number,
  status: WebsiteStatus
) {
  if (count <= 0) return false;
  if (ticks.length < count) return false;
  return ticks.slice(0, count).every((tick) => tick.status === status);
}

async function evaluateIncidentForWebsite(websiteId: string) {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: {
      url: true,
      incident_open_after: true,
      incident_resolve_after: true,
    },
  });

  if (!website) return;

  const openAfter = normalizeThreshold(website.incident_open_after, DEFAULT_OPEN_AFTER);
  const resolveAfter = normalizeThreshold(website.incident_resolve_after, DEFAULT_RESOLVE_AFTER);
  const windowSize = Math.max(openAfter, resolveAfter);
  const recentTicks = await prisma.websiteTick.findMany({
    where: { website_id: websiteId },
    orderBy: { created_at: "desc" },
    take: windowSize,
  });

  const hasDowns = hasConsecutiveStatus(recentTicks, openAfter, "Down");
  const hasUps = hasConsecutiveStatus(recentTicks, resolveAfter, "Up");

  const openIncident = await prisma.incident.findFirst({
    where: {
      website_id: websiteId,
      status: { in: ["Open", "Acknowledged"] },
    },
    orderBy: { created_at: "desc" },
  });

  const websiteUrl = website.url ?? websiteId;

  if (hasDowns && !openIncident) {
    const reason = `${openAfter} consecutive failures`;

    const incident = await prisma.incident.create({
      data: {
        website_id: websiteId,
        status: "Open",
        severity: "Critical",
        title: `Endpoint down: ${websiteUrl}`,
        fingerprint: `${websiteId}:consecutive-down`,
        last_seen_at: new Date(),
      },
    });

    await prisma.incidentEvent.create({
      data: {
        incident_id: incident.id,
        type: "Detected",
        message: reason,
        metadata: {
          website_id: websiteId,
        },
      },
    });

    await notifyIncidentOpened({
      incidentId: incident.id,
      websiteId,
      websiteUrl,
      severity: incident.severity,
      title: incident.title,
      reason,
    });

    return;
  }

  if (hasUps && openIncident) {
    const reason = `${resolveAfter} consecutive successes`;

    const incident = await prisma.incident.update({
      where: { id: openIncident.id },
      data: {
        status: "Resolved",
        resolved_at: new Date(),
        last_seen_at: new Date(),
      },
    });

    await prisma.incidentEvent.create({
      data: {
        incident_id: incident.id,
        type: "Resolved",
        message: reason,
        metadata: {
          website_id: websiteId,
        },
      },
    });

    await notifyIncidentResolved({
      incidentId: incident.id,
      websiteId,
      websiteUrl,
      severity: incident.severity,
      title: incident.title,
      reason,
    });

    return;
  }

  if (hasDowns && openIncident) {
    await prisma.incident.update({
      where: { id: openIncident.id },
      data: { last_seen_at: new Date() },
    });
  }
}

async function evaluateIncidents(websiteIds: string[]) {
  for (const websiteId of websiteIds) {
    try {
      await evaluateIncidentForWebsite(websiteId);
    } catch (err) {
      console.error("[incident-eval]", websiteId, err);
    }
  }
}

const bulkUploadToDB = async (client: ReturnType<typeof createClient>) => {
  let res = await client.xReadGroup(
    GROUP_NAME,
    CONSUMER_NAME,
    { key: STREAM_KEY, id: "0" },
    { COUNT: 1000 }
  );

  let websites =
    (res as unknown as Array<{ messages: WebsiteTypeFromStream2[] }> | null)?.[0]
      ?.messages ?? [];

  if (websites.length === 0) {
    res = await client.xReadGroup(
      GROUP_NAME,
      CONSUMER_NAME,
      { key: STREAM_KEY, id: ">" },
      { COUNT: 1000 }
    );
    websites =
      (res as unknown as Array<{ messages: WebsiteTypeFromStream2[] }> | null)?.[0]
        ?.messages ?? [];
  }

  if (websites.length === 0) return;

  await prisma.websiteTick.createMany({
    data: websites.map((website) => ({
      response_time_ms: Number(website.message.response_time_ms),
      status: website.message.status,
      region_id: website.message.region_id,
      website_id: website.message.websiteId
    }))
  });

  const websiteIds = Array.from(new Set(websites.map((website) => website.message.websiteId)));
  await evaluateIncidents(websiteIds);

  const ids = websites.map((w) => w.id);
  if (ids.length) {
    await client.xAck(STREAM_KEY, GROUP_NAME, ids);
  }
};

async function main() {
  const client = await createClient({ url: process.env.REDIS_URL })
    .on("error", (err) => console.error("Redis Client Error", err))
    .connect();

  await ensureGroup(client);
  console.log(`[bulkUploadConsumer] polling stream "${STREAM_KEY}" every 5 s`);

  let isRunning = false;
  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await bulkUploadToDB(client);
    } catch (err) {
      console.error("bulkUploadToDB failed:", err);
    } finally {
      isRunning = false;
    }
  }, 5000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});