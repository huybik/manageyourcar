// File: /api/activity-logs/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertActivityLogSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const logs = await storage.getActivityLogs();
      return res.status(200).json(logs);
    } else if (req.method === "POST") {
      const body = { ...req.body };
      if (body.timestamp && typeof body.timestamp === "string") {
        body.timestamp = new Date(body.timestamp);
      }
      if (body.relatedId === "") {
        body.relatedId = null;
      }

      const logData = insertActivityLogSchema.parse(body);
      const log = await storage.createActivityLog(logData);
      return res.status(201).json(log);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err: any) {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      console.error("Validation Error:", validationError.details);
      return res.status(400).json({
        message: validationError.message,
        details: validationError.details,
      });
    }
    console.error("Activity Log API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
