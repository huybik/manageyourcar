/* /shared/schema.ts */
// File: /shared/schema.ts
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  json,
  interval, // Import interval type
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // TODO: Hash this in a real app
  name: text("name").notNull(),
  role: text("role").notNull(), // 'company_admin', 'driver'
  email: text("email"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  notificationEnabled: boolean("notification_enabled").default(true),
  fcmToken: text("fcm_token"), // For push notifications
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional().nullable(),
  role: z.enum(["company_admin", "driver"]),
}).omit({
  id: true,
});

// Vehicle Schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'truck', 'sedan', 'van', etc.
  vin: text("vin").notNull().unique(),
  licensePlate: text("license_plate"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: text("status").notNull(), // 'active', 'maintenance', 'out_of_service'
  // Removed nextMaintenanceDate/Mileage - will be derived from parts/schedules
  qrCode: text("qr_code"), // QR code for vehicle identification/scanning
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0),
  status: z.enum(["active", "maintenance", "out_of_service"]),
}).omit({
  id: true,
  // Removed nextMaintenanceDate/Mileage from Zod schema as well
});

// Parts Inventory Schema
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  isStandard: boolean("is_standard").default(true), // Whether this is a standard part or a custom part
  price: real("price").notNull(),
  quantity: integer("quantity").default(0), // Current stock quantity
  minimumStock: integer("minimum_stock").default(10), // Minimum required stock level
  supplier: text("supplier"),
  location: text("location"),
  imageUrl: text("image_url"),
  // Default lifecycle
  maintenanceIntervalDays: integer("maintenance_interval_days"), // Default days between maintenance/replacement
  maintenanceIntervalMileage: integer("maintenance_interval_mileage"), // Default miles between maintenance/replacement
  lastRestocked: timestamp("last_restocked"), // Date of last restock
  compatibleVehicles: json("compatible_vehicles").$type<string[]>(), // Array of compatible vehicle makes/models
});

export const insertPartSchema = createInsertSchema(parts, {
  price: z.number().positive(),
  quantity: z.number().int().min(0).optional().default(0),
  minimumStock: z.number().int().min(0).optional().default(10),
  maintenanceIntervalDays: z.number().int().min(0).optional().nullable(),
  maintenanceIntervalMileage: z.number().int().min(0).optional().nullable(),
  compatibleVehicles: z.array(z.string()).optional().nullable(),
}).omit({
  id: true,
});

// Vehicle-Parts Association Schema (Tracks specific part instances on vehicles)
export const vehicleParts = pgTable("vehicle_parts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .references(() => vehicles.id)
    .notNull(),
  partId: integer("part_id")
    .references(() => parts.id)
    .notNull(),
  installationDate: timestamp("installation_date").notNull(),
  installationMileage: integer("installation_mileage").notNull(),
  // Override default interval if needed for this specific instance
  customMaintenanceIntervalDays: integer("custom_maintenance_interval_days"),
  customMaintenanceIntervalMileage: integer(
    "custom_maintenance_interval_mileage"
  ),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  lastMaintenanceMileage: integer("last_maintenance_mileage"),
  // nextMaintenanceDate/Mileage will be calculated based on intervals and last maintenance/installation
  notes: text("notes"),
});

export const insertVehiclePartSchema = createInsertSchema(vehicleParts, {
  installationDate: z.date().or(z.string().datetime()),
  installationMileage: z.number().int().min(0),
  customMaintenanceIntervalDays: z.number().int().min(0).optional().nullable(),
  customMaintenanceIntervalMileage: z
    .number()
    .int()
    .min(0)
    .optional()
    .nullable(),
  lastMaintenanceDate: z.date().or(z.string().datetime()).optional().nullable(),
  lastMaintenanceMileage: z.number().int().min(0).optional().nullable(),
}).omit({
  id: true,
});

// General Service Schedule Schema
export const serviceSchedules = pgTable("service_schedules", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .references(() => vehicles.id)
    .notNull(),
  description: text("description").notNull(), // e.g., "General Checkup", "6-Month Service"
  frequencyDays: integer("frequency_days"),
  frequencyMileage: integer("frequency_mileage"),
  lastServiceDate: timestamp("last_service_date"),
  lastServiceMileage: integer("last_service_mileage"),
  // nextServiceDate/Mileage will be calculated
  notes: text("notes"),
});

export const insertServiceScheduleSchema = createInsertSchema(
  serviceSchedules,
  {
    frequencyDays: z.number().int().min(0).optional().nullable(),
    frequencyMileage: z.number().int().min(0).optional().nullable(),
    lastServiceDate: z.date().or(z.string().datetime()).optional().nullable(),
    lastServiceMileage: z.number().int().min(0).optional().nullable(),
  }
).omit({
  id: true,
});

// Maintenance Schema
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .references(() => vehicles.id)
    .notNull(),
  // Link to specific part instance or service schedule that triggered this (optional)
  vehiclePartId: integer("vehicle_part_id").references(() => vehicleParts.id),
  serviceScheduleId: integer("service_schedule_id").references(
    () => serviceSchedules.id
  ),
  type: text("type").notNull(), // 'part_replacement', 'part_maintenance', 'general_service', 'unscheduled_repair'
  description: text("description"),
  // Due date might be less relevant if triggered by mileage, but good for scheduling
  dueDate: timestamp("due_date"),
  status: text("status").notNull(), // 'pending', 'scheduled', 'in_progress', 'completed', 'rejected' (for unscheduled)
  priority: text("priority").notNull(), // 'low', 'normal', 'high', 'critical'
  assignedTo: integer("assigned_to").references(() => users.id),
  completedDate: timestamp("completed_date"),
  completedMileage: integer("completed_mileage"), // Record mileage at completion
  notes: text("notes"), // Driver notes for unscheduled, mechanic notes for completed
  partsUsed: json("parts_used"), // Array of { partId, quantity } for parts consumed
  cost: real("cost"), // Cost of maintenance
  bill: json("bill"), // Bill details including items, labor, etc.
  billImageUrl: text("bill_image_url"), // Image of receipt/bill
  isUnscheduled: boolean("is_unscheduled").default(false), // True if reported by driver unexpectedly
  approvalStatus: text("approval_status"), // 'pending', 'approved', 'rejected' (for unscheduled maintenance)
  approvedBy: integer("approved_by").references(() => users.id), // Who approved the unscheduled maintenance
});

export const insertMaintenanceSchema = createInsertSchema(maintenance, {
  dueDate: z.date().or(z.string().datetime()).optional().nullable(), // Due date is optional now
  status: z.enum([
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "rejected",
  ]),
  priority: z.enum(["low", "normal", "high", "critical"]),
  partsUsed: z
    .array(z.object({ partId: z.number(), quantity: z.number() }))
    .optional()
    .nullable(),
  cost: z.number().positive().optional().nullable(),
  approvalStatus: z
    .enum(["pending", "approved", "rejected"])
    .optional()
    .nullable(),
  completedMileage: z.number().int().min(0).optional().nullable(),
}).omit({
  id: true,
  completedDate: true, // completedDate is set when status changes to 'completed'
});

// Notifications Schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'maintenance_due', 'maintenance_approval_request', 'low_stock', etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull(),
  relatedId: integer("related_id"), // ID of the related entity
  relatedType: text("related_type"), // Type of the related entity
  link: text("link"), // Link to navigate to in the app
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  createdAt: z.date().or(z.string().datetime()),
}).omit({
  id: true,
});

// Orders Schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull(), // 'pending', 'approved', 'ordered', 'received', 'cancelled'
  createdDate: timestamp("created_date").notNull(),
  orderedDate: timestamp("ordered_date"),
  receivedDate: timestamp("received_date"),
  createdBy: integer("created_by")
    .references(() => users.id)
    .notNull(),
  supplier: text("supplier"),
  totalAmount: real("total_amount"),
  notes: text("notes"),
});

export const insertOrderSchema = createInsertSchema(orders, {
  status: z.enum(["pending", "approved", "ordered", "received", "cancelled"]),
  createdDate: z.date().or(z.string().datetime()),
  totalAmount: z.number().positive().optional().nullable(),
}).omit({
  id: true,
  orderNumber: true, // Generated by the server
  orderedDate: true, // Set later
  receivedDate: true, // Set later
});

// Order Items Schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  partId: integer("part_id")
    .references(() => parts.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  quantity: z.number().int().positive(),
  price: z.number().positive(),
}).omit({
  id: true,
});

// Activity Log Schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(), // 'maintenance_completed', 'part_added', 'order_placed', etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  relatedId: integer("related_id"), // ID of the related entity (vehicle, part, etc.)
  relatedType: text("related_type"), // Type of the related entity ('vehicle', 'part', etc.)
});

export const insertActivityLogSchema = createInsertSchema(activityLogs, {
  timestamp: z.date().or(z.string().datetime()),
}).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;

export type VehiclePart = typeof vehicleParts.$inferSelect;
export type InsertVehiclePart = z.infer<typeof insertVehiclePartSchema>;

export type ServiceSchedule = typeof serviceSchedules.$inferSelect;
export type InsertServiceSchedule = z.infer<typeof insertServiceScheduleSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
