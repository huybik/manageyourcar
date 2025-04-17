// File: /api/order-items/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertOrderItemSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "POST") {
      const itemData = insertOrderItemSchema.parse(req.body);
      const item = await storage.createOrderItem(itemData);
      return res.status(201).json(item);
    }
    // Add GET/PUT/DELETE by ID if needed in separate [id].ts file
    else {
      res.setHeader("Allow", ["POST"]);
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
    console.error("Order Item API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
