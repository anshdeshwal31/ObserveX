import { createClient } from "redis";
import { prisma } from "@repo/db";

const STREAM_KEY = "pingNova:websiteResponse";
const GROUP_NAME = "usa";
const CONSUMER_NAME = "us-1";

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

const bulkUploadToDB = async (client: ReturnType<typeof createClient>) => {
  const res = await client.xReadGroup(
    GROUP_NAME,
    CONSUMER_NAME,
    {
      key: STREAM_KEY,
      id: ">"
    },
    { COUNT: 1000 }
  );

  const websites =
    (res as unknown as Array<{ messages: WebsiteTypeFromStream2[] }> | null)?.[0]
      ?.messages ?? [];

  if (websites.length === 0) return;

  await prisma.websiteTick.createMany({
    data: websites.map((website) => ({
      response_time_ms: Number(website.message.response_time_ms),
      status: website.message.status,
      region_id: website.message.region_id,
      website_id: website.message.websiteId
    }))
  });

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