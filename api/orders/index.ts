// File: /api/orders/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertOrderSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const orders = await storage.getOrders();
      return res.status(200).json(orders);
    } else if (req.method === "POST") {
      const body = { ...req.body };
      if (body.createdDate && typeof body.createdDate === "string") {
        body.createdDate = new Date(body.createdDate);
      }
      if (body.orderedDate && typeof body.orderedDate === "string") {
        body.orderedDate = new Date(body.orderedDate);
      }
      if (body.receivedDate && typeof body.receivedDate === "string") {
        body.receivedDate = new Date(body.receivedDate);
      }

      const orderData = insertOrderSchema.parse(body);
      const order = await storage.createOrder(orderData);
      return res.status(201).json(order);
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
    console.error("Order API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
