// File: /api/orders/[orderId]/items.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { orderId: idString } = req.query;
  const orderId = parseInt(idString as string);

  if (isNaN(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    if (req.method === "GET") {
      const items = await storage.getOrderItemsForOrder(orderId);
      return res.status(200).json(items);
    } else {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err: any) {
    console.error(`Order Items API error for Order ID ${orderId}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
