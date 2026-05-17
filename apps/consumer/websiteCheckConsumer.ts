import { createClient } from "redis";
import axios from "axios";
import { addToWebsiteInfoList } from "../producer/websiteInfoProducer";

const STREAM_KEY = "pingNova:website";
const GROUP_NAME = "usa";           // must match the group used in xAck
const CONSUMER_NAME = "us-1";
const REGION_ID = process.env.REGION_ID!; // injected via env — must be a valid Region.id in the DB

type Stream1Message = {
  id: string;
  message: {
    url: string;
    id: string;
  };
};

type StreamReadReply<T> = Array<{
  name: string;
  messages: T[];
}>;

async function ensureGroup(client: ReturnType<typeof createClient>) {
  try {
    await client.xGroupCreate(STREAM_KEY, GROUP_NAME, "0", {
      MKSTREAM: true
    });
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) {
      throw err;
    }
  }
}

async function main() {
  const client = await createClient({ url: process.env.REDIS_URL })
    .on("error", (err) => console.error("Redis Client Error", err))
    .connect();

  await ensureGroup(client);

  console.log(`[websiteCheckConsumer] listening on stream "${STREAM_KEY}", group "${GROUP_NAME}"`);

  while (true) {
    const res = await client.xReadGroup(
      GROUP_NAME,
      CONSUMER_NAME,
      {
        key: STREAM_KEY,
        id: ">"
      },
      {
        COUNT: 10,
        BLOCK: 0
      }
    );

    if (!res) continue;

    const streams = res as unknown as StreamReadReply<Stream1Message> | null;
    const websites = streams?.[0]?.messages ?? [];
    const ackIds: string[] = [];

    for (const website of websites) {
      const startTime = Date.now();
      try {
        await axios.get(website.message.url, { timeout: 10_000 });
        await addToWebsiteInfoList(website, "Up", Date.now() - startTime, REGION_ID);
        ackIds.push(website.id);
      } catch {
        try {
          await addToWebsiteInfoList(website, "Down", -1, REGION_ID);
          ackIds.push(website.id);
        } catch {
          // If stream2 push fails, do NOT ack — message will be retried
        }
      }
    }

    if (ackIds.length > 0) {
      // ← fixed: group name is now "usa" (same as the group we read from)
      await client.xAck(STREAM_KEY, GROUP_NAME, ackIds);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});