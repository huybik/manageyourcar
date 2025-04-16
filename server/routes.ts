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
  insertActivityLogSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for validation errors
  const handleValidationError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // For simplicity, we're returning the user without the password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords before sending response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      return res.status(200).json(sanitizedUsers);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
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
      const vehicles = await storage.getVehicles();
      return res.status(200).json(vehicles);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      return res.status(200).json(vehicle);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/users/:userId/vehicles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const vehicles = await storage.getVehiclesByUser(userId);
      return res.status(200).json(vehicles);
    } catch (err) {
      return handleValidationError(err, res);
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
      const vehicleData = req.body;
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
      const success = await storage.deleteVehicle(id);
      
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      return res.status(204).end();
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Parts routes
  app.get("/api/parts", async (req, res) => {
    try {
      const parts = await storage.getParts();
      return res.status(200).json(parts);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/parts/low-stock", async (req, res) => {
    try {
      const parts = await storage.getLowStockParts();
      return res.status(200).json(parts);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const part = await storage.getPart(id);
      
      if (!part) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      return res.status(200).json(part);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.post("/api/parts", async (req, res) => {
    try {
      const partData = insertPartSchema.parse(req.body);
      const existingPart = await storage.getPartBySku(partData.sku);
      
      if (existingPart) {
        return res.status(409).json({ message: "Part with this SKU already exists" });
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
      const partData = req.body;
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
      const success = await storage.deletePart(id);
      
      if (!success) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      return res.status(204).end();
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", async (req, res) => {
    try {
      const maintenance = await storage.getMaintenanceTasks();
      return res.status(200).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/maintenance/pending", async (req, res) => {
    try {
      const maintenance = await storage.getPendingMaintenance();
      return res.status(200).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const maintenance = await storage.getMaintenance(id);
      
      if (!maintenance) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
      return res.status(200).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/vehicles/:vehicleId/maintenance", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const maintenance = await storage.getMaintenanceForVehicle(vehicleId);
      return res.status(200).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const maintenanceData = insertMaintenanceSchema.parse(req.body);
      const maintenance = await storage.createMaintenance(maintenanceData);
      return res.status(201).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.put("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const maintenanceData = req.body;
      const maintenance = await storage.updateMaintenance(id, maintenanceData);
      
      if (!maintenance) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
      return res.status(200).json(maintenance);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMaintenance(id);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance task not found" });
      }
      
      return res.status(204).end();
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      return res.status(200).json(orders);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      return res.status(200).json(order);
    } catch (err) {
      return handleValidationError(err, res);
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
      const orderData = req.body;
      const order = await storage.updateOrder(id, orderData);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      return res.status(200).json(order);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      return res.status(204).end();
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Order Items routes
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const items = await storage.getOrderItemsForOrder(orderId);
      return res.status(200).json(items);
    } catch (err) {
      return handleValidationError(err, res);
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
      const itemData = req.body;
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
      const success = await storage.deleteOrderItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Order item not found" });
      }
      
      return res.status(204).end();
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  // Activity Log routes
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      return res.status(200).json(logs);
    } catch (err) {
      return handleValidationError(err, res);
    }
  });

  app.get("/api/activity-logs/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const logs = await storage.getRecentActivityLogs(limit);
      return res.status(200).json(logs);
    } catch (err) {
      return handleValidationError(err, res);
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
