// File: /api/activity-logs/recent.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await storage.getRecentActivityLogs(limit);
    return res.status(200).json(logs);
  } catch (err: any) {
    console.error("Recent activity logs API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
