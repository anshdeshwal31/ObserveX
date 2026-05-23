import { prisma } from "@repo/db";
import * as dns from "node:dns";
import * as net from "node:net";
import * as https from "node:https";
import * as http from "node:http";

export async function performDiagnostics(urlStr: string) {
  const result: any = { url: urlStr, timestamp: new Date().toISOString() };
  try {
    const url = new URL(urlStr);
    result.hostname = url.hostname;
    result.protocol = url.protocol;

    // DNS Lookup
    const dnsStartTime = Date.now();
    try {
      const addresses = await dns.promises.resolveAny(url.hostname);
      result.dns = { status: "success", timeMs: Date.now() - dnsStartTime, records: addresses };
    } catch (e: any) {
      result.dns = { status: "error", error: e.message, timeMs: Date.now() - dnsStartTime };
    }

    // TCP Connection
    const port = url.port ? parseInt(url.port) : (url.protocol === "https:" ? 443 : 80);
    const tcpStartTime = Date.now();
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(port, url.hostname, () => {
        result.tcp = { status: "success", timeMs: Date.now() - tcpStartTime };
        socket.destroy();
        resolve();
      });
      socket.setTimeout(5000);
      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("TCP connection timeout"));
      });
      socket.on("error", (err) => reject(err));
    }).catch(e => {
      result.tcp = { status: "error", error: e.message, timeMs: Date.now() - tcpStartTime };
    });

    // HTTP Request
    const httpStartTime = Date.now();
    const client = url.protocol === "https:" ? https : http;
    await new Promise<void>((resolve, reject) => {
      const req = client.get(urlStr, { timeout: 5000 }, (res) => {
        result.http = {
          status: "success",
          statusCode: res.statusCode,
          headers: res.headers,
          timeMs: Date.now() - httpStartTime,
        };
        let body = "";
        res.on("data", chunk => {
          if (body.length < 500) body += chunk.toString();
        });
        res.on("end", () => {
          result.http.bodySnippet = body.substring(0, 500);
          resolve();
        });
      });
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("HTTP request timeout"));
      });
      req.on("error", err => reject(err));
    }).catch(e => {
      if (!result.http) {
        result.http = { status: "error", error: e.message, timeMs: Date.now() - httpStartTime };
      }
    });

  } catch (err: any) {
    result.globalError = err.message;
  }
  return result;
}

async function callGroqAPI(prompt: string, model = "llama3-8b-8192"): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing from environment variables");

  console.log(`[AIOps] Calling Groq (${model})...`);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq/${model} error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGeminiAPI(prompt: string, model = "gemini-2.0-flash-lite"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing from environment variables");

  console.log(`[AIOps] Calling Gemini (${model})...`);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  if (!res.ok) {
    const body = await res.text();
    // For rate limit errors, parse the retry delay and throw a special error
    if (res.status === 429) {
      let retryAfterSecs = 60;
      try {
        const parsed = JSON.parse(body);
        const retryInfo = parsed?.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
        if (retryInfo?.retryDelay) {
          retryAfterSecs = parseInt(retryInfo.retryDelay) || 60;
        }
      } catch {}
      throw new Error(`Gemini/${model} rate limited (429) — retry after ${retryAfterSecs}s`);
    }
    throw new Error(`Gemini/${model} error ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateRCAReport(diagnosticData: any, url: string): Promise<string> {
  const prompt = `
You are an expert Site Reliability Engineer (SRE).
A website (${url}) is currently experiencing an outage. We ran an automated diagnostic probe.
Analyze the following raw JSON diagnostic results and generate a clean, structured Markdown SRE report.

Diagnostic Data:
${JSON.stringify(diagnosticData, null, 2)}

Your report MUST include the following sections exactly:
### 🚨 Outage Profile
A breakdown of what failed based on the data (e.g., DNS, TCP, SSL, Application/HTTP level).

### 🔍 Probable Root Cause
The likely infrastructure or application reason for the outage based on the characteristics of the failure.

### 🛠️ Remediation Steps
Step-by-step instructions for a developer/sysadmin to investigate and fix the issue.

Keep the tone highly technical, concise, and professional. Output ONLY the markdown report.
`;

  // 4-model cascade — tries each in order, logs which one succeeds/fails
  const models: Array<() => Promise<string>> = [
    () => callGroqAPI(prompt, "llama3-8b-8192"),
    () => callGroqAPI(prompt, "mixtral-8x7b-32768"),
    () => callGeminiAPI(prompt, "gemini-2.0-flash-lite"),
    () => callGeminiAPI(prompt, "gemini-1.5-flash-8b"),
  ];

  let lastError: unknown;
  for (const callModel of models) {
    try {
      const result = await callModel();
      console.log("[AIOps] ✅ RCA report generated successfully.");
      return result;
    } catch (err) {
      console.error("[AIOps] Model failed, trying next:", (err as Error).message);
      lastError = err;
    }
  }
  throw new Error(`All LLM models failed. Last error: ${(lastError as Error).message}`);
}


export async function runAIOpsRCA(incidentId: string, websiteUrl: string, websiteId: string) {
  try {
    console.log(`[AIOps] Running background diagnostic probe for ${websiteUrl}...`);
    const diagnosticData = await performDiagnostics(websiteUrl);
    
    console.log(`[AIOps] Generating RCA report via LLM for ${websiteUrl}...`);
    const rcaReport = await generateRCAReport(diagnosticData, websiteUrl);

    console.log(`[AIOps] Saving RCA report to database for incident ${incidentId}...`);
    await prisma.incidentEvent.create({
      data: {
        incident_id: incidentId,
        type: "Detected",
        message: "AIOps Root Cause Analysis Report",
        metadata: {
          website_id: websiteId,
          rca_report: rcaReport,
          diagnostic_data: diagnosticData
        },
      },
    });
  } catch (err) {
    console.error("[AIOps] Failed to run RCA for incident:", incidentId, err);
    await prisma.incidentEvent.create({
      data: {
        incident_id: incidentId,
        type: "Detected",
        message: "AIOps Root Cause Analysis Failed",
        metadata: {
          website_id: websiteId,
          error: String(err)
        },
      },
    });
  }
}
