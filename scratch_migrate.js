const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_9sb0JIwBVLQp@ep-calm-salad-ailwmyw9-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Make password optional
    await client.query('ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;');
    console.log("Made password optional");
    
    // Add email column
    await client.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;');
    await client.query('ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");');
    console.log("Added email column");

    // Make username optional
    await client.query('ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;');
    console.log("Made username optional");
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
