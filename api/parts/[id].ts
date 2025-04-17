// File: /api/parts/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertPartSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: idString } = req.query;
  const id = parseInt(idString as string);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid part ID" });
  }

  try {
    if (req.method === "GET") {
      const part = await storage.getPart(id);
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      return res.status(200).json(part);
    } else if (req.method === "PUT") {
      const body = { ...req.body };
      if (body.lastRestocked && typeof body.lastRestocked === "string") {
        body.lastRestocked = new Date(body.lastRestocked);
      }
      const partData = insertPartSchema.partial().parse(body);
      const part = await storage.updatePart(id, partData);
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      return res.status(200).json(part);
    } else if (req.method === "DELETE") {
      const success = await storage.deletePart(id);
      if (!success) {
        return res.status(404).json({ message: "Part not found" });
      }
      return res.status(204).end();
    } else {
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
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
    console.error(`Part API error for ID ${id}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
