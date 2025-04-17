// File: /api/maintenance/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertMaintenanceSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: idString } = req.query;
  const id = parseInt(idString as string);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid maintenance ID" });
  }

  try {
    if (req.method === "GET") {
      const maintenance = await storage.getMaintenance(id);
      if (!maintenance) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      return res.status(200).json(maintenance);
    } else if (req.method === "PUT") {
      const body = { ...req.body };
      if (body.dueDate && typeof body.dueDate === "string") {
        body.dueDate = new Date(body.dueDate);
      }
      if (body.completedDate && typeof body.completedDate === "string") {
        body.completedDate = new Date(body.completedDate);
      }
      if (body.assignedTo === "") {
        body.assignedTo = null;
      }
      if (body.approvedBy === "") {
        body.approvedBy = null;
      }
      if (typeof body.partsUsed === "string") {
        try {
          body.partsUsed = JSON.parse(body.partsUsed);
        } catch {
          /* ignore */
        }
      }
      if (typeof body.bill === "string") {
        try {
          body.bill = JSON.parse(body.bill);
        } catch {
          /* ignore */
        }
      }

      const maintenanceData = insertMaintenanceSchema.partial().parse(body);
      const maintenance = await storage.updateMaintenance(id, maintenanceData);
      if (!maintenance) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      return res.status(200).json(maintenance);
    } else if (req.method === "DELETE") {
      const success = await storage.deleteMaintenance(id);
      if (!success) {
        return res.status(404).json({ message: "Maintenance task not found" });
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
    console.error(`Maintenance API error for ID ${id}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
