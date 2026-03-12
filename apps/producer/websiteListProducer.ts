// mongoose
import { createClient } from "redis";
import {prisma} from "@repo/db"

interface websiteType{
    id:string ,
    url:string , 
    user_id:string ,
    time_added :Date ,

}

async function main() {
  const client = createClient().on("error", (err) =>
    console.log("Redis Client Error", err)
  );

  await client.connect();

  try {
    const websites = await prisma.website.findMany();

    for (const website of websites) {
      await client.xAdd("pingNova:website", "*", {
        url: website.url,
        id: website.id,
      });
    }

  } finally {
    await client.quit(); // graceful shutdown
  }
}

main()
setInterval(main, 3*1000*60);