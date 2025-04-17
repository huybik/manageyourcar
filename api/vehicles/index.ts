// File: /api/vehicles/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertVehicleSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const vehicles = await storage.getVehicles();
      return res.status(200).json(vehicles);
    } else if (req.method === "POST") {
      // Ensure dates are handled correctly if sent as strings
      const body = { ...req.body };
      if (
        body.nextMaintenanceDate &&
        typeof body.nextMaintenanceDate === "string"
      ) {
        body.nextMaintenanceDate = new Date(body.nextMaintenanceDate);
      }
      if (body.assignedTo === "") {
        // Handle empty string for optional foreign key
        body.assignedTo = null;
      }
      if (body.nextMaintenanceMileage === "") {
        body.nextMaintenanceMileage = null;
      }

      const vehicleData = insertVehicleSchema.parse(body);
      const vehicle = await storage.createVehicle(vehicleData);
      return res.status(201).json(vehicle);
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
    console.error("Vehicle API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
