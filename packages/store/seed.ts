/**
 * Seed script — run once to insert the "us-east-1" region into the database.
 * This region_id must match the REGION_ID env variable set on the consumer.
 *
 * Usage:  bun packages/store/seed.ts
 */
import "dotenv/config";
import { prisma } from "./src/client";

async function main() {
  const region = await prisma.region.upsert({
    where: { id: "us-east-1" },
    update: {},
    create: {
      id: "us-east-1",
      name: "US East (N. Virginia)",
    },
  });

  console.log("✅ Region seeded:", region);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
