// File: /api/maintenance/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertMaintenanceSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const maintenance = await storage.getMaintenanceTasks();
      return res.status(200).json(maintenance);
    } else if (req.method === "POST") {
      const body = { ...req.body };
      // Convert date strings to Date objects
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
      // Ensure partsUsed and bill are parsed if they are strings (though ideally sent as objects)
      if (typeof body.partsUsed === "string") {
        try {
          body.partsUsed = JSON.parse(body.partsUsed);
        } catch {
          /* ignore parse error */
        }
      }
      if (typeof body.bill === "string") {
        try {
          body.bill = JSON.parse(body.bill);
        } catch {
          /* ignore parse error */
        }
      }

      const maintenanceData = insertMaintenanceSchema.parse(body);
      const maintenance = await storage.createMaintenance(maintenanceData);
      return res.status(201).json(maintenance);
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
    console.error("Maintenance API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
