// File: /api/vehicles/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertVehicleSchema } from "../../shared/schema"; // For partial updates
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: idString } = req.query;
  const id = parseInt(idString as string);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid vehicle ID" });
  }

  try {
    if (req.method === "GET") {
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return res.status(200).json(vehicle);
    } else if (req.method === "PUT") {
      const body = { ...req.body };
      if (
        body.nextMaintenanceDate &&
        typeof body.nextMaintenanceDate === "string"
      ) {
        body.nextMaintenanceDate = new Date(body.nextMaintenanceDate);
      }
      if (body.assignedTo === "") {
        body.assignedTo = null;
      }
      if (body.nextMaintenanceMileage === "") {
        body.nextMaintenanceMileage = null;
      }
      // Use partial schema for updates
      const vehicleData = insertVehicleSchema.partial().parse(body);
      const vehicle = await storage.updateVehicle(id, vehicleData);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      return res.status(200).json(vehicle);
    } else if (req.method === "DELETE") {
      const success = await storage.deleteVehicle(id);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
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
    console.error(`Vehicle API error for ID ${id}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
