import { createClient } from "redis";
import axios from "axios";
import { addToWebsiteInfoList } from "../producer/websiteInfoProducer";

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
    await client.xGroupCreate("pingNova:website", "usa", "0", {
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
        key: "pingNova:website",
        id: ">"
      },
      {
        COUNT: 10,
        BLOCK: 0
      }
    );

    if (!res) {
      continue;
    }

    const streams = res as unknown as StreamReadReply<Stream1Message> | null;
    const websites = streams?.[0]?.messages ?? [];
    const ackIds: string[] = [];
    console.log({websites})
    for (const website of websites) {
      const startTime = Date.now();

      try {
        await axios.get(website.message.url);
        await addToWebsiteInfoList(website, "Up", Date.now() - startTime, "a88b2cf2-5bb8-4306-86e9-1bf98ab33097");
        ackIds.push(website.id);
      } catch(error) {
        console.log({error})
        try {
          await addToWebsiteInfoList(website, "Down", -1, "a88b2cf2-5bb8-4306-86e9-1bf98ab33097");
          ackIds.push(website.id);
        } catch {
          // If stream2 push fails, do not ack so message can be retried.
        }
      }
    }

    if (ackIds.length > 0) {
      await client.xAck("pingNova:website", "a88b2cf2-5bb8-4306-86e9-1bf98ab33097", ackIds);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});