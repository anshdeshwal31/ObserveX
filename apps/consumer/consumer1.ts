import { createClient } from "redis";
import axios from "axios";
import { addToStream2 } from "../producer/producer2";

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
    // Create group once; if already exists, Redis throws BUSYGROUP.
    await client.xGroupCreate("observeX:website", "usa", "0", {
      MKSTREAM: true
    });
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) {
      throw err;
    }
  }
}

async function main() {
  const client = await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

  await ensureGroup(client);

  while (true) {
    const res = await client.xReadGroup(
      "usa",
      "us-1",
      {
        key: "observeX:website",
        id: ">"
      },
      {
        COUNT: 10,
        BLOCK: 5000
      }
    );

    if (!res) {
      continue;
    }

    const streams = res as unknown as StreamReadReply<Stream1Message> | null;
    const websites = streams?.[0]?.messages ?? [];
    const ackIds: string[] = [];

    for (const website of websites) {
      const startTime = Date.now();

      try {
        await axios.get(website.message.url);
        await addToStream2(website, "Up", Date.now() - startTime, "usa");
        ackIds.push(website.id);
      } catch {
        try {
          await addToStream2(website, "Down", -1, "usa");
          ackIds.push(website.id);
        } catch {
          // If stream2 push fails, do not ack so message can be retried.
        }
      }
    }

    if (ackIds.length > 0) {
      await client.xAck("observeX:website", "usa", ackIds);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});