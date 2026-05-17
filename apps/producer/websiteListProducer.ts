import { createClient } from "redis";
import { prisma } from "@repo/db";

const STREAM_KEY = "pingNova:website";

async function main() {
  const client = await createClient({ url: process.env.REDIS_URL })
    .on("error", (err) => console.error("Redis Client Error", err))
    .connect();

  console.log("[websiteListProducer] starting — will push every 3 min");

  const pushWebsites = async () => {
    try {
      const websites = await prisma.website.findMany();
      console.log(`[websiteListProducer] pushing ${websites.length} websites`);
      for (const website of websites) {
        await client.xAdd(STREAM_KEY, "*", {
          url: website.url,
          id: website.id,
        });
      }
    } catch (err) {
      console.error("[websiteListProducer] failed to push websites:", err);
    }
  };

  // Run immediately, then repeat every 3 minutes
  await pushWebsites();
  setInterval(pushWebsites, 3 * 60 * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});