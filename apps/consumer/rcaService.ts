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

async function callGroqAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    throw new Error(`Groq error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callFallbackLLM(prompt: string): Promise<string> {
  // Using Gemini API as fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
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

  try {
    return await callGroqAPI(prompt);
  } catch (err) {
    console.error("[AIOps] Groq API failed, falling back to Gemini:", err);
    return await callFallbackLLM(prompt);
  }
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
