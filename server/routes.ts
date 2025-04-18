/* /server/routes.ts */
// File: /server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertVehicleSchema,
  insertPartSchema,
  insertMaintenanceSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertActivityLogSchema,
  insertVehiclePartSchema, // Added
  insertServiceScheduleSchema, // Added
  users,
  vehicles,
  parts,
  maintenance,
  orders,
  orderItems,
  Order, // Import Order type
  Maintenance as MaintenanceType, // Import Maintenance type
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper function to ensure a value is a Date object or null for nullable fields
const ensureDateOrNull = (
  value: string | Date | undefined | null
): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    console.error(`Failed to parse date value: ${value}`, e);
  }
  return null; // Return null if parsing fails or value is invalid
};

// Helper function to ensure a value is a Date object for non-nullable fields
const ensureDateRequired = (value: string | Date | undefined | null): Date => {
  const date = ensureDateOrNull(value);
  if (date === null) {
    throw new Error(`Invalid or missing required date value: ${value}`);
  }
  return date;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for validation errors
  const handleValidationError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(err); // Log unexpected errors
    // Avoid sending detailed internal errors to the client
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      // TODO: Implement proper password hashing and comparison
      if (!user || user.password !== password) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      // For simplicity, we're returning the user without the password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      // Log the actual error on the server
      console.error("Login error:", err);
      // Send a generic error message to the client
      return res
        .status(500)
        .json({ message: "An error occurred during login." });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const usersList = await storage.getUsers();
      // Remove passwords before sending response
      const sanitizedUsers = usersList.map(({ password, ...rest }) => rest);
      return res.status(200).json(sanitizedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Failed to fetch users." });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID." });
      }
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password before sending response
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      console.error(`Error fetching user ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to fetch user." });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // TODO: Hash password before storing
      const user = await storage.createUser(userData);
      // Remove password before sending response
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehiclesList = await storage.getVehicles();
      return res.status(200).json(vehiclesList);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      return res.status(500).json({ message: "Failed to fetch vehicles." });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      const vehicle = await storage.getVehicle(id);

      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      return res.status(200).json(vehicle);
    } catch (err) {
      console.error(`Error fetching vehicle ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to fetch vehicle." });
    }
  });

  app.get("/api/users/:userId/vehicles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
      }
      const vehiclesList = await storage.getVehiclesByUser(userId);
      return res.status(200).json(vehiclesList);
    } catch (err) {
      console.error(
        `Error fetching vehicles for user ${req.params.userId}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch user vehicles." });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      return res.status(201).json(vehicle);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      // Validate partial data
      const vehicleData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, vehicleData);

      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      return res.status(200).json(vehicle);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      const success = await storage.deleteVehicle(id);

      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting vehicle ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to delete vehicle." });
    }
  });

  // Parts routes
  app.get("/api/parts", async (req, res) => {
    try {
      const partsList = await storage.getParts();
      return res.status(200).json(partsList);
    } catch (err) {
      console.error("Error fetching parts:", err);
      return res.status(500).json({ message: "Failed to fetch parts." });
    }
  });

  // New route for standard parts
  app.get("/api/parts/standard", async (req, res) => {
    try {
      const partsList = await storage.getStandardParts();
      return res.status(200).json(partsList);
    } catch (err) {
      console.error("Error fetching standard parts:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch standard parts." });
    }
  });

  app.get("/api/parts/low-stock", async (req, res) => {
    try {
      const partsList = await storage.getLowStockParts();
      return res.status(200).json(partsList);
    } catch (err) {
      console.error("Error fetching low stock parts:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch low stock parts." });
    }
  });

  app.get("/api/parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid part ID." });
      }
      const part = await storage.getPart(id);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      return res.status(200).json(part);
    } catch (err) {
      console.error(`Error fetching part ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to fetch part." });
    }
  });

  app.post("/api/parts", async (req, res) => {
    try {
      const partData = insertPartSchema.parse(req.body);
      const existingPart = await storage.getPartBySku(partData.sku);

      if (existingPart) {
        return res
          .status(409)
          .json({ message: "Part with this SKU already exists" });
      }

      const part = await storage.createPart(partData);
      return res.status(201).json(part);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid part ID." });
      }
      const partData = insertPartSchema.partial().parse(req.body);
      const part = await storage.updatePart(id, partData);

      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }

      return res.status(200).json(part);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid part ID." });
      }
      const success = await storage.deletePart(id);

      if (!success) {
        return res.status(404).json({ message: "Part not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting part ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to delete part." });
    }
  });

  // Vehicle Parts routes
  app.get("/api/vehicles/:vehicleId/parts", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      const vehiclePartsList = await storage.getVehiclePartsByVehicle(
        vehicleId
      );
      return res.status(200).json(vehiclePartsList);
    } catch (err) {
      console.error(
        `Error fetching parts for vehicle ${req.params.vehicleId}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch vehicle parts." });
    }
  });

  // Get vehicle parts needing maintenance
  app.get("/api/vehicle-parts/due", async (req, res) => {
    try {
      const vehicleIdsParam = req.query.vehicleIds as string | undefined;
      let vehicleIds: number[] | undefined;
      if (vehicleIdsParam) {
        vehicleIds = vehicleIdsParam
          .split(",")
          .map(Number)
          .filter((id) => !isNaN(id));
      }
      const partsDue = await storage.getVehiclePartsNeedingMaintenance(
        vehicleIds
      );
      return res.status(200).json(partsDue);
    } catch (err) {
      console.error("Error fetching due vehicle parts:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch due vehicle parts." });
    }
  });

  app.post("/api/vehicle-parts", async (req, res) => {
    try {
      const vehiclePartData = insertVehiclePartSchema.parse(req.body);
      // TODO: Add validation to ensure vehicle and part exist
      const vehiclePart = await storage.createVehiclePart(vehiclePartData);
      return res.status(201).json(vehiclePart);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/vehicle-parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle part ID." });
      }
      const vehiclePartData = insertVehiclePartSchema.partial().parse(req.body);
      const vehiclePart = await storage.updateVehiclePart(id, vehiclePartData);

      if (!vehiclePart) {
        return res.status(404).json({ message: "Vehicle part not found" });
      }

      return res.status(200).json(vehiclePart);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/vehicle-parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle part ID." });
      }
      const success = await storage.deleteVehiclePart(id);

      if (!success) {
        return res.status(404).json({ message: "Vehicle part not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting vehicle part ${req.params.id}:`, err);
      return res
        .status(500)
        .json({ message: "Failed to delete vehicle part." });
    }
  });

  // Service Schedule routes
  app.get("/api/vehicles/:vehicleId/service-schedules", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      const schedules = await storage.getServiceSchedulesForVehicle(vehicleId);
      return res.status(200).json(schedules);
    } catch (err) {
      console.error(
        `Error fetching service schedules for vehicle ${req.params.vehicleId}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch service schedules." });
    }
  });

  app.post("/api/service-schedules", async (req, res) => {
    try {
      const scheduleData = insertServiceScheduleSchema.parse(req.body);
      // TODO: Add validation to ensure vehicle exists
      const schedule = await storage.createServiceSchedule(scheduleData);
      return res.status(201).json(schedule);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/service-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID." });
      }
      const scheduleData = insertServiceScheduleSchema
        .partial()
        .parse(req.body);
      const schedule = await storage.updateServiceSchedule(id, scheduleData);

      if (!schedule) {
        return res.status(404).json({ message: "Service schedule not found" });
      }

      return res.status(200).json(schedule);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/service-schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid schedule ID." });
      }
      const success = await storage.deleteServiceSchedule(id);

      if (!success) {
        return res.status(404).json({ message: "Service schedule not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting service schedule ${req.params.id}:`, err);
      return res
        .status(500)
        .json({ message: "Failed to delete service schedule." });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", async (req, res) => {
    try {
      const maintenanceList = await storage.getMaintenanceTasks();
      return res.status(200).json(maintenanceList);
    } catch (err) {
      console.error("Error fetching maintenance tasks:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch maintenance tasks." });
    }
  });

  app.get("/api/maintenance/pending", async (req, res) => {
    try {
      const maintenanceList = await storage.getPendingMaintenance();
      return res.status(200).json(maintenanceList);
    } catch (err) {
      console.error("Error fetching pending maintenance:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch pending maintenance tasks." });
    }
  });

  // Get maintenance reminders for a specific driver
  app.get("/api/users/:userId/maintenance-reminders", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
      }
      // Get vehicles assigned to the driver
      const driverVehicles = await storage.getVehiclesByUser(userId);
      const vehicleIds = driverVehicles.map((v) => v.id);

      if (vehicleIds.length === 0) {
        return res.status(200).json([]); // No vehicles, no reminders
      }

      // Get parts and schedules needing maintenance for these vehicles
      const partsDue = await storage.getVehiclePartsNeedingMaintenance(
        vehicleIds
      );
      const schedulesDue = await storage.getServiceSchedulesNeedingMaintenance(
        vehicleIds
      );

      // Combine and format reminders (this is a simplified example)
      const reminders = [
        ...partsDue.map((vp) => ({
          type: "part",
          vehiclePartId: vp.id,
          vehicleId: vp.vehicleId,
          description: `Part maintenance due for vehicle ${vp.vehicleId}`, // Enhance with part name
          dueDate: vp.lastMaintenanceDate, // Placeholder, actual due date needs calculation
        })),
        ...schedulesDue.map((ss) => ({
          type: "schedule",
          serviceScheduleId: ss.id,
          vehicleId: ss.vehicleId,
          description: ss.description,
          dueDate: ss.lastServiceDate, // Placeholder, actual due date needs calculation
        })),
      ];

      return res.status(200).json(reminders);
    } catch (err) {
      console.error(
        `Error fetching maintenance reminders for user ${req.params.userId}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch maintenance reminders." });
    }
  });

  app.get("/api/maintenance/pending-approval", async (req, res) => {
    try {
      // TODO: Add role check - only company admin should access this
      const tasks = await storage.getPendingApprovalMaintenance();
      return res.status(200).json(tasks);
    } catch (err) {
      console.error("Error fetching pending approval maintenance:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch pending approval tasks." });
    }
  });

  app.get("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid maintenance ID." });
      }
      const maintenanceTask = await storage.getMaintenance(id);

      if (!maintenanceTask) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }

      return res.status(200).json(maintenanceTask);
    } catch (err) {
      console.error(`Error fetching maintenance task ${req.params.id}:`, err);
      return res
        .status(500)
        .json({ message: "Failed to fetch maintenance task." });
    }
  });

  app.get("/api/vehicles/:vehicleId/maintenance", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      if (isNaN(vehicleId)) {
        return res.status(400).json({ message: "Invalid vehicle ID." });
      }
      const maintenanceList = await storage.getMaintenanceForVehicle(vehicleId);
      return res.status(200).json(maintenanceList);
    } catch (err) {
      console.error(
        `Error fetching maintenance for vehicle ${req.params.vehicleId}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch vehicle maintenance tasks." });
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const maintenanceData = insertMaintenanceSchema.parse(req.body);
      // If unscheduled, set approval status to pending
      if (maintenanceData.isUnscheduled) {
        maintenanceData.approvalStatus = "pending";
        maintenanceData.status = "pending"; // Initial status for unscheduled
      }
      const maintenanceTask = await storage.createMaintenance(maintenanceData);
      // TODO: Create notification for admin if unscheduled
      return res.status(201).json(maintenanceTask);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid maintenance ID." });
      }

      // Prepare data, ensuring dates are handled correctly
      const maintenanceData: Partial<MaintenanceType> = {
        ...req.body,
        dueDate: ensureDateOrNull(req.body.dueDate),
        completedDate: ensureDateOrNull(req.body.completedDate),
      };

      // Validate the processed data against a partial schema if necessary
      // For simplicity, we assume the storage layer handles further validation
      // const validatedData = insertMaintenanceSchema.partial().parse(maintenanceData);

      const maintenanceTask = await storage.updateMaintenance(
        id,
        maintenanceData // Pass the processed data
      );

      if (!maintenanceTask) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }

      return res.status(200).json(maintenanceTask);
    } catch (err) {
      // Handle potential errors from ensureDateOrNull or storage.updateMaintenance
      console.error(`Error updating maintenance ${req.params.id}:`, err);
      if (err instanceof ZodError) {
        return handleValidationError(err, res);
      }
      return res
        .status(500)
        .json({ message: "Failed to update maintenance task." });
    }
  });

  // Endpoint for approving/rejecting unscheduled maintenance
  app.put("/api/maintenance/:id/approval", async (req, res) => {
    try {
      // TODO: Add role check - only company admin
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid maintenance ID." });
      }
      const { approved, userId } = req.body; // userId of the admin approving/rejecting
      if (typeof approved !== "boolean" || typeof userId !== "number") {
        return res
          .status(400)
          .json({ message: "Approval status and user ID required." });
      }

      let updatedTask;
      if (approved) {
        updatedTask = await storage.approveMaintenance(id, userId);
      } else {
        updatedTask = await storage.rejectMaintenance(id, userId);
      }

      if (!updatedTask) {
        return res
          .status(404)
          .json({ message: "Maintenance task not found or not unscheduled." });
      }
      // TODO: Create notification for driver about approval/rejection
      return res.status(200).json(updatedTask);
    } catch (err) {
      console.error(
        `Error updating maintenance approval ${req.params.id}:`,
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to update maintenance approval." });
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid maintenance ID." });
      }
      const success = await storage.deleteMaintenance(id);

      if (!success) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting maintenance task ${req.params.id}:`, err);
      return res
        .status(500)
        .json({ message: "Failed to delete maintenance task." });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const ordersList = await storage.getOrders();
      return res.status(200).json(ordersList);
    } catch (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).json({ message: "Failed to fetch orders." });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
      }
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json(order);
    } catch (err) {
      console.error(`Error fetching order ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to fetch order." });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      return res.status(201).json(order);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
      }
      // Use Partial<Order> to allow updating all fields, including generated ones if needed by logic
      const orderData: Partial<Order> = {
        ...req.body,
        // Ensure dates are handled correctly
        createdDate: req.body.createdDate
          ? ensureDateRequired(req.body.createdDate)
          : undefined,
        orderedDate: req.body.orderedDate
          ? ensureDateOrNull(req.body.orderedDate)
          : undefined,
        receivedDate: req.body.receivedDate
          ? ensureDateOrNull(req.body.receivedDate)
          : undefined,
      };

      // Validate the processed data against a partial schema if necessary,
      // or rely on the storage layer's validation/handling.
      // For simplicity, we pass the processed data directly.

      const order = await storage.updateOrder(id, orderData);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json(order);
    } catch (err) {
      // Handle potential errors from ensureDateRequired or storage.updateOrder
      console.error(`Error updating order ${req.params.id}:`, err);
      if (err instanceof ZodError) {
        return handleValidationError(err, res);
      }
      return res.status(500).json({ message: "Failed to update order." });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID." });
      }
      const success = await storage.deleteOrder(id);

      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting order ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to delete order." });
    }
  });

  // Order Items routes
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID." });
      }
      const items = await storage.getOrderItemsForOrder(orderId);
      return res.status(200).json(items);
    } catch (err) {
      console.error(
        `Error fetching items for order ${req.params.orderId}:`,
        err
      );
      return res.status(500).json({ message: "Failed to fetch order items." });
    }
  });

  app.post("/api/order-items", async (req, res) => {
    try {
      const itemData = insertOrderItemSchema.parse(req.body);
      const item = await storage.createOrderItem(itemData);
      return res.status(201).json(item);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order item ID." });
      }
      const itemData = insertOrderItemSchema.partial().parse(req.body);
      const item = await storage.updateOrderItem(id, itemData);

      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }

      return res.status(200).json(item);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/order-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order item ID." });
      }
      const success = await storage.deleteOrderItem(id);

      if (!success) {
        return res.status(404).json({ message: "Order item not found" });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(`Error deleting order item ${req.params.id}:`, err);
      return res.status(500).json({ message: "Failed to delete order item." });
    }
  });

  // Activity Log routes
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      return res.status(200).json(logs);
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch activity logs." });
    }
  });

  app.get("/api/activity-logs/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ message: "Invalid limit parameter." });
      }
      const logs = await storage.getRecentActivityLogs(limit);
      return res.status(200).json(logs);
    } catch (err) {
      console.error("Error fetching recent activity logs:", err);
      return res
        .status(500)
        .json({ message: "Failed to fetch recent activity logs." });
    }
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      const logData = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(logData);
      return res.status(201).json(log);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
