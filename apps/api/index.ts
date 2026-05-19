import { clerkMiddleware } from '@clerk/express'
import express from "express"
import cors from "cors"
import {prisma} from "@repo/db"
import { authMiddleware } from "./middleware";
import type { Request, Response } from "express";
import { isValidUrl } from "./utils";
import { notifyIncidentResolved } from "./incidentNotify";

const app = express();
const MIN_THRESHOLD = 1;
const MAX_THRESHOLD = 10;

function parseThreshold(value: unknown) {
    if (value === undefined) {
        return { provided: false } as const;
    }

    if (value === null) {
        return { provided: true, value: null } as const;
    }

    const num = typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : typeof value === "number"
            ? value
            : Number.NaN;

    if (!Number.isInteger(num)) {
        return { error: "must be an integer" } as const;
    }

    if (num < MIN_THRESHOLD || num > MAX_THRESHOLD) {
        return { error: `must be between ${MIN_THRESHOLD} and ${MAX_THRESHOLD}` } as const;
    }

    return { provided: true, value: num } as const;
}

// CORS — allow requests from the frontend origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "https://app1.theansh.site"
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("https://app1.theansh.site")) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
}));

app.use(express.json())
app.use(clerkMiddleware())

// Auth handled by Clerk. Signup/Signin routes removed.

// ─── GET all websites for the authenticated user ──────────────────────────────
app.get("/websites", authMiddleware, async (req: Request, res: Response) => {
    try {
        const websites = await prisma.website.findMany({
            where: { user_id: req.user_id! },
            orderBy: { time_added: "desc" }
        });
        res.json({ websites });
    } catch (error) {
        console.error("[GET /websites]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── add website ─────────────────────────────────────────────────────────────
app.post("/website", authMiddleware, async (req: Request, res: Response) => {
    const { url, incident_open_after, incident_resolve_after } = req.body;

    if (!url) {
        res.status(400).json({ message: "url is required." });
        return;
    }

    if (!isValidUrl(url)) {
        res.status(400).json({ message: "url must be a valid http/https URL." });
        return;
    }

    const openParsed = parseThreshold(incident_open_after);
    if ("error" in openParsed) {
        res.status(400).json({ message: `incident_open_after ${openParsed.error}` });
        return;
    }

    const resolveParsed = parseThreshold(incident_resolve_after);
    if ("error" in resolveParsed) {
        res.status(400).json({ message: `incident_resolve_after ${resolveParsed.error}` });
        return;
    }

    try {
        const data: {
            url: string;
            user_id: string;
            incident_open_after?: number | null;
            incident_resolve_after?: number | null;
        } = {
            url,
            user_id: req.user_id!
        };

        if (openParsed.provided) {
            data.incident_open_after = openParsed.value;
        }

        if (resolveParsed.provided) {
            data.incident_resolve_after = resolveParsed.value;
        }

        const website = await prisma.website.create({ data });
        res.status(201).json({ id: website.id });
    } catch (error) {
        console.error("[POST /website]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── update per-website incident thresholds ───────────────────────────────
app.patch("/website/:websiteId/thresholds", authMiddleware, async (req: Request, res: Response) => {
    const websiteId = Array.isArray(req.params.websiteId)
        ? req.params.websiteId[0]!
        : req.params.websiteId;

    const openParsed = parseThreshold(req.body?.incident_open_after);
    if ("error" in openParsed) {
        res.status(400).json({ message: `incident_open_after ${openParsed.error}` });
        return;
    }

    const resolveParsed = parseThreshold(req.body?.incident_resolve_after);
    if ("error" in resolveParsed) {
        res.status(400).json({ message: `incident_resolve_after ${resolveParsed.error}` });
        return;
    }

    if (!openParsed.provided && !resolveParsed.provided) {
        res.status(400).json({ message: "Provide incident_open_after and/or incident_resolve_after." });
        return;
    }

    try {
        const website = await prisma.website.findFirst({
            where: { id: websiteId, user_id: req.user_id! }
        });

        if (!website) {
            res.status(404).json({ message: "Website not found." });
            return;
        }

        const data: {
            incident_open_after?: number | null;
            incident_resolve_after?: number | null;
        } = {};

        if (openParsed.provided) {
            data.incident_open_after = openParsed.value;
        }

        if (resolveParsed.provided) {
            data.incident_resolve_after = resolveParsed.value;
        }

        const updated = await prisma.website.update({
            where: { id: website.id },
            data
        });

        res.json({ website: updated });
    } catch (error) {
        console.error("[PATCH /website/:websiteId/thresholds]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── get website status ───────────────────────────────────────────────────────
app.get("/status/:websiteId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const websiteId = Array.isArray(req.params.websiteId)
            ? req.params.websiteId[0]!
            : req.params.websiteId;

        const websiteInfo = await prisma.website.findFirst({
            where: {
                user_id: req.user_id!,    // ← fixed: was req.body.user_id (always undefined on GET)
                id: websiteId
            },
            include: {
                ticks: {
                    orderBy: [{ created_at: "desc" }],
                    take: 50               // return last 50 ticks for the detail page
                }
            }
        });

        if (!websiteInfo) {
            res.status(404).json({ message: "Website not found." });
            return;                        // ← fixed: missing return caused double-response
        }

        res.json({ websiteInfo });

    } catch (error) {
        console.error("[GET /status/:websiteId]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── list incidents for the authenticated user ─────────────────────────────
app.get("/incidents", authMiddleware, async (req: Request, res: Response) => {
    try {
        const incidents = await prisma.incident.findMany({
            where: {
                website: {
                    user_id: req.user_id!
                }
            },
            include: {
                website: {
                    select: { id: true, url: true }
                }
            },
            orderBy: { created_at: "desc" }
        });

        res.json({ incidents });
    } catch (error) {
        console.error("[GET /incidents]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── incident detail ───────────────────────────────────────────────────────
app.get("/incidents/:incidentId", authMiddleware, async (req: Request, res: Response) => {
    try {
        const incidentId = Array.isArray(req.params.incidentId)
            ? req.params.incidentId[0]!
            : req.params.incidentId;

        const incident = await prisma.incident.findFirst({
            where: {
                id: incidentId,
                website: { user_id: req.user_id! }
            },
            include: {
                website: { select: { id: true, url: true } },
                events: { orderBy: { created_at: "desc" } }
            }
        });

        if (!incident) {
            res.status(404).json({ message: "Incident not found." });
            return;
        }

        res.json({ incident });
    } catch (error) {
        console.error("[GET /incidents/:incidentId]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── acknowledge incident ──────────────────────────────────────────────────
app.post("/incidents/:incidentId/ack", authMiddleware, async (req: Request, res: Response) => {
    try {
        const incidentId = Array.isArray(req.params.incidentId)
            ? req.params.incidentId[0]!
            : req.params.incidentId;

        const incident = await prisma.incident.findFirst({
            where: {
                id: incidentId,
                website: { user_id: req.user_id! }
            }
        });

        if (!incident) {
            res.status(404).json({ message: "Incident not found." });
            return;
        }

        if (incident.status === "Resolved") {
            res.status(409).json({ message: "Incident already resolved." });
            return;
        }

        const now = new Date();
        const updated = await prisma.$transaction(async (tx) => {
            const next = await tx.incident.update({
                where: { id: incident.id },
                data: {
                    status: "Acknowledged",
                    acknowledged_at: now
                }
            });

            await tx.incidentEvent.create({
                data: {
                    incident_id: incident.id,
                    type: "Acknowledged",
                    message: "Acknowledged by operator",
                    metadata: { user_id: req.user_id }
                }
            });

            return next;
        });

        res.json({ incident: updated });
    } catch (error) {
        console.error("[POST /incidents/:incidentId/ack]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ─── resolve incident ──────────────────────────────────────────────────────
app.post("/incidents/:incidentId/resolve", authMiddleware, async (req: Request, res: Response) => {
    try {
        const incidentId = Array.isArray(req.params.incidentId)
            ? req.params.incidentId[0]!
            : req.params.incidentId;

        const incident = await prisma.incident.findFirst({
            where: {
                id: incidentId,
                website: { user_id: req.user_id! }
            },
            include: { website: { select: { url: true } } }
        });

        if (!incident) {
            res.status(404).json({ message: "Incident not found." });
            return;
        }

        if (incident.status === "Resolved") {
            res.status(409).json({ message: "Incident already resolved." });
            return;
        }

        const now = new Date();
        const updated = await prisma.$transaction(async (tx) => {
            const next = await tx.incident.update({
                where: { id: incident.id },
                data: {
                    status: "Resolved",
                    resolved_at: now
                }
            });

            await tx.incidentEvent.create({
                data: {
                    incident_id: incident.id,
                    type: "Resolved",
                    message: "Resolved by operator",
                    metadata: { user_id: req.user_id }
                }
            });

            return next;
        });

        await notifyIncidentResolved({
            incidentId: updated.id,
            websiteId: updated.website_id,
            websiteUrl: incident.website.url,
            severity: updated.severity,
            title: updated.title,
            reason: "Resolved by operator",
        });

        res.json({ incident: updated });
    } catch (error) {
        console.error("[POST /incidents/:incidentId/resolve]", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`API running on port ${process.env.PORT || 3000}`);
});