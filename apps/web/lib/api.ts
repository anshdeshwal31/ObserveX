// lib/api.ts
// Updated for Clerk Authentication

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type WebsiteStatus = "Up" | "Down" | "Unknown";

export type WebsiteTick = {
  id: string;
  response_time_ms: number;
  status: WebsiteStatus;
  region_id: string;
  website_id: string;
  created_at: string;
};

export type WebsiteInfo = {
  id: string;
  url: string;
  user_id: string;
  time_added: string;
  ticks: WebsiteTick[];
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { message?: string; error?: unknown };

  if (!response.ok) {
    const errMsg =
      (data as { message?: string }).message ??
      `Request failed with status ${response.status}`;
    throw new Error(errMsg);
  }

  return data as T;
}

export async function addWebsite(url: string, token: string): Promise<{ id: string }> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/website`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });
  return parseJson<{ id: string }>(response);
}

/** Fetch all websites for the signed-in user from the API. */
export async function getWebsites(token: string): Promise<WebsiteInfo[]> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/websites`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseJson<{ websites: WebsiteInfo[] }>(response);
  return data.websites;
}

export async function getWebsiteStatus(websiteId: string, token: string): Promise<WebsiteInfo | null> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/status/${websiteId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseJson<{ websiteInfo?: WebsiteInfo; message?: string }>(response);

  if (!data.websiteInfo) return null;
  return data.websiteInfo;
}
