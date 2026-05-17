import { createClient } from "redis"

const STREAM_KEY = "pingNova:websiteResponse";

interface WebsiteType {
    id: string,
    message: {
        url: string,
        id: string
    }
}

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
    if (client) return client;
    client = await createClient({ url: process.env.REDIS_URL })
        .on("error", (err) => console.error("Redis Client Error", err))
        .connect();
    return client;
}

export const addToWebsiteInfoList = async (
    website: WebsiteType,
    status: string,
    response_time_ms: number,
    region_id: string
) => {
    const c = await getClient();
    await c.xAdd(STREAM_KEY, "*", {
        websiteUrl: website.message.url,
        websiteId: website.message.id,
        status,
        response_time_ms: response_time_ms.toString(),
        region_id
    });
};
