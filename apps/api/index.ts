import { clerkMiddleware } from '@clerk/express'
import express from "express"
import cors from "cors"
import {prisma} from "@repo/db"
import { authMiddleware } from "./middleware";
import type { Request, Response } from "express";
import { isValidUrl } from "./utils";

const app = express();

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
    const { url } = req.body;

    if (!url) {
        res.status(400).json({ message: "url is required." });
        return;
    }

    if (!isValidUrl(url)) {
        res.status(400).json({ message: "url must be a valid http/https URL." });
        return;
    }

    try {
        const website = await prisma.website.create({
            data: {
                url,
                user_id: req.user_id!
            }
        });
        res.status(201).json({ id: website.id });
    } catch (error) {
        console.error("[POST /website]", error);
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

app.listen(process.env.PORT || 3000, () => {
    console.log(`API running on port ${process.env.PORT || 3000}`);
});