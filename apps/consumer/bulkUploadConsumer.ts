import { createClient } from "redis";
import { prisma } from "@repo/db";

const client = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

// create group once; ignore if it already exists
try {
  await client.xGroupCreate("pingNova:websiteResponse", "usa", "0", {
    MKSTREAM: true
  });
} catch (e: any) {
  if (!String(e?.message || e).includes("BUSYGROUP")) throw e;
}

type WebsiteStatus = "Up" | "Down" | "Unknown";

interface websiteTypeFromStream2 {
  id: string;
  message: {
    websiteUrl: string;
    websiteId: string;
    status: WebsiteStatus; // not string
    response_time_ms: string;
    region_id: string;
  };
}

const bulkUploadToDB = async () => {
  try {
      const res = await client.xReadGroup(
        "usa",
        "us-1",
      {
        key: "pingNova:websiteResponse",
        id: ">"
      },
      {
        COUNT: 1000
      }
      );

      const websites =
        (res as unknown as Array<{ messages: websiteTypeFromStream2[] }> | null)?.[0]
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

      const ids = websites.map((w) => w.id) ;
      if (ids.length) {
        await client.xAck("pingNova:websiteResponse", "usa", ids);
      }
      
  } catch (error) {
      console.log({error})
  }
};

let isRunning = false;

setInterval(async () => {
  if (isRunning) return; // guard: skip this tick
  isRunning = true;

  try {
    await bulkUploadToDB();
  } catch (err) {
    console.error("bulkUploadToDB failed:", err);
  } finally {
    isRunning = false; // always release lock
  }
}, 5000);