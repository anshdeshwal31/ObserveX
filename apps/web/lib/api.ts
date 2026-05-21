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
  incident_open_after?: number | null;
  incident_resolve_after?: number | null;
  ticks: WebsiteTick[];
};

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data: any = null;
  let text = "";

  if (isJson) {
    data = await response.json();
  } else {
    text = await response.text();
  }

  if (!response.ok) {
    const errMsg =
      data?.message ??
      (text ? text.slice(0, 100) : `Request failed with status ${response.status}`);
    throw new Error(errMsg);
  }

  return data as T;
}

export async function addWebsite(
  url: string,
  token: string,
  thresholds?: {
    incident_open_after?: number | null;
    incident_resolve_after?: number | null;
  }
): Promise<{ id: string }> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/website`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url,
      ...(thresholds ?? {}),
    }),
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

export async function updateWebsiteThresholds(
  websiteId: string,
  token: string,
  thresholds: {
    incident_open_after?: number | null;
    incident_resolve_after?: number | null;
  }
): Promise<WebsiteInfo> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/website/${websiteId}/thresholds`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(thresholds),
  });

  const data = await parseJson<{ website: WebsiteInfo }>(response);
  return data.website;
}

export type Incident = {
  id: string;
  website_id: string;
  status: "Open" | "Acknowledged" | "Resolved";
  severity: "Critical" | "High" | "Medium" | "Low";
  title: string;
  created_at: string;
  resolved_at?: string;
  events?: IncidentEvent[];
};

export type IncidentEvent = {
  id: string;
  type: string;
  message: string;
  metadata?: any;
  created_at: string;
};

export async function getIncidents(token: string): Promise<Incident[]> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/incidents`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseJson<{ incidents: Incident[] }>(response);
  return data.incidents;
}

export async function getIncidentDetails(incidentId: string, token: string): Promise<Incident> {
  if (!token) throw new Error("You are not signed in.");

  const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseJson<{ incident: Incident }>(response);
  return data.incident;
}
