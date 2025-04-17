// File: /api/vehicles/[vehicleId]/maintenance.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { vehicleId: idString } = req.query;
  const vehicleId = parseInt(idString as string);

  if (isNaN(vehicleId)) {
    return res.status(400).json({ message: "Invalid vehicle ID" });
  }

  try {
    if (req.method === "GET") {
      const maintenance = await storage.getMaintenanceForVehicle(vehicleId);
      return res.status(200).json(maintenance);
    } else {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err: any) {
    console.error(`Maintenance API error for Vehicle ID ${vehicleId}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
