// File: /api/maintenance/pending.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const maintenance = await storage.getPendingMaintenance();
    return res.status(200).json(maintenance);
  } catch (err: any) {
    console.error("Pending maintenance API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
