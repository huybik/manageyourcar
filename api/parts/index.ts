// File: /api/parts/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertPartSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const parts = await storage.getParts();
      return res.status(200).json(parts);
    } else if (req.method === "POST") {
      const body = { ...req.body };
      if (body.lastRestocked && typeof body.lastRestocked === "string") {
        body.lastRestocked = new Date(body.lastRestocked);
      }
      const partData = insertPartSchema.parse(body);
      const existingPart = await storage.getPartBySku(partData.sku);

      if (existingPart) {
        return res
          .status(409)
          .json({ message: "Part with this SKU already exists" });
      }

      const part = await storage.createPart(partData);
      return res.status(201).json(part);
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
    console.error("Part API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
