import { getToken } from "./auth";

const API_BASE_URL = "http://localhost:3000";

type AuthPayload = {
  username: string;
  password: string;
};

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

export async function signup(payload: AuthPayload): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/user/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ id: string }>(response);
}

export async function signin(payload: AuthPayload): Promise<{ jwt: string }> {
  const response = await fetch(`${API_BASE_URL}/user/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<{ jwt: string }>(response);
}

export async function addWebsite(url: string): Promise<{ id: string }> {
  const token = getToken();

  if (!token) {
    throw new Error("You are not signed in.");
  }

  const response = await fetch(`${API_BASE_URL}/website`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ url }),
  });

  return parseJson<{ id: string }>(response);
}

export async function getWebsiteStatus(websiteId: string): Promise<WebsiteInfo | null> {
  const token = getToken();

  if (!token) {
    throw new Error("You are not signed in.");
  }

  const response = await fetch(`${API_BASE_URL}/status/${websiteId}`, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  });

  const data = await parseJson<{ websiteInfo?: WebsiteInfo; message?: string }>(response);

  if (!data.websiteInfo) {
    return null;
  }

  return data.websiteInfo;
}
