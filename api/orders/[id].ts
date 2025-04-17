// File: /api/orders/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertOrderSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: idString } = req.query;
  const id = parseInt(idString as string);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    if (req.method === "GET") {
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.status(200).json(order);
    } else if (req.method === "PUT") {
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
      const orderData = insertOrderSchema.partial().parse(body);
      const order = await storage.updateOrder(id, orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.status(200).json(order);
    } else if (req.method === "DELETE") {
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
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
    console.error(`Order API error for ID ${id}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
