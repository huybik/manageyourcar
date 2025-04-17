
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = sqliteTable("users", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'company_admin', 'driver'
  email: text("email"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  notificationEnabled: integer("notification_enabled", { mode: 'boolean' }).default(true),
  fcmToken: text("fcm_token"), // For push notifications
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});
export const selectUserSchema = createSelectSchema(users);

// Vehicle Schema
export const vehicles = sqliteTable("vehicles", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'truck', 'sedan', 'van', etc.
  vin: text("vin").notNull().unique(),
  licensePlate: text("license_plate"),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year", { mode: 'number' }).notNull(),
  mileage: integer("mileage", { mode: 'number' }).notNull(),
  assignedTo: integer("assigned_to", { mode: 'number' }).references(() => users.id),
  status: text("status").notNull(), // 'active', 'maintenance', 'out_of_service'
  nextMaintenanceDate: integer("next_maintenance_date", { mode: 'timestamp_ms' }), // Store as Unix timestamp (milliseconds)
  nextMaintenanceMileage: integer("next_maintenance_mileage", { mode: 'number' }),
  qrCode: text("qr_code"), // QR code for vehicle identification/scanning
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  // Ensure numbers are treated correctly
  year: z.number().int(),
  mileage: z.number().int(),
  assignedTo: z.number().int().optional().nullable(),
  nextMaintenanceMileage: z.number().int().optional().nullable(),
  // Zod schema expects Date, Drizzle handles conversion to timestamp_ms
  nextMaintenanceDate: z.date().optional().nullable(),
}).omit({
  id: true,
});
export const selectVehicleSchema = createSelectSchema(vehicles, {
  nextMaintenanceDate: z.date().nullable(), // Drizzle converts timestamp_ms back to Date
});


// Parts Inventory Schema
export const parts = sqliteTable("parts", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  isStandard: integer("is_standard", { mode: 'boolean' }).default(true), // Whether this is a standard part or a custom part
  price: real("price").notNull(),
  quantity: integer("quantity", { mode: 'number' }).default(0), // Current stock quantity
  minimumStock: integer("minimum_stock", { mode: 'number' }).default(10), // Minimum required stock level
  supplier: text("supplier"),
  location: text("location"),
  imageUrl: text("image_url"),
  maintenanceInterval: integer("maintenance_interval", { mode: 'number' }), // Default miles between maintenance
  lastRestocked: integer("last_restocked", { mode: 'timestamp_ms' }), // Date of last restock
  compatibleVehicles: text("compatible_vehicles", { mode: 'json' }).$type<string[]>(), // Array of compatible vehicle makes/models
});

export const insertPartSchema = createInsertSchema(parts, {
  price: z.number(),
  quantity: z.number().int(),
  minimumStock: z.number().int(),
  maintenanceInterval: z.number().int().optional().nullable(),
  lastRestocked: z.date().optional().nullable(),
  compatibleVehicles: z.array(z.string()).optional().nullable(), // Ensure JSON field is handled
}).omit({
  id: true,
});
export const selectPartSchema = createSelectSchema(parts, {
  lastRestocked: z.date().nullable(),
  compatibleVehicles: z.array(z.string()).nullable(), // Ensure JSON field is handled
});

// Vehicle-Parts Association Schema
export const vehicleParts = sqliteTable("vehicle_parts", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id", { mode: 'number' }).references(() => vehicles.id).notNull(),
  partId: integer("part_id", { mode: 'number' }).references(() => parts.id).notNull(),
  isCustom: integer("is_custom", { mode: 'boolean' }).default(false), // Whether this is a custom part for this vehicle
  maintenanceInterval: integer("maintenance_interval", { mode: 'number' }), // Miles between maintenance
  lastMaintenanceDate: integer("last_maintenance_date", { mode: 'timestamp_ms' }),
  lastMaintenanceMileage: integer("last_maintenance_mileage", { mode: 'number' }),
  nextMaintenanceDate: integer("next_maintenance_date", { mode: 'timestamp_ms' }),
  nextMaintenanceMileage: integer("next_maintenance_mileage", { mode: 'number' }),
  notes: text("notes"),
});

export const insertVehiclePartSchema = createInsertSchema(vehicleParts, {
  vehicleId: z.number().int(),
  partId: z.number().int(),
  maintenanceInterval: z.number().int().optional().nullable(),
  lastMaintenanceMileage: z.number().int().optional().nullable(),
  nextMaintenanceMileage: z.number().int().optional().nullable(),
  lastMaintenanceDate: z.date().optional().nullable(),
  nextMaintenanceDate: z.date().optional().nullable(),
}).omit({
  id: true,
});
export const selectVehiclePartSchema = createSelectSchema(vehicleParts, {
  lastMaintenanceDate: z.date().nullable(),
  nextMaintenanceDate: z.date().nullable(),
});

// Maintenance Schema
export const maintenance = sqliteTable("maintenance", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id", { mode: 'number' }).references(() => vehicles.id).notNull(),
  type: text("type").notNull(), // 'oil_change', 'brake_inspection', 'tire_rotation', etc.
  description: text("description"),
  dueDate: integer("due_date", { mode: 'timestamp_ms' }).notNull(),
  status: text("status").notNull(), // 'pending', 'scheduled', 'completed', 'overdue'
  priority: text("priority").notNull(), // 'low', 'normal', 'high', 'critical'
  assignedTo: integer("assigned_to", { mode: 'number' }).references(() => users.id),
  completedDate: integer("completed_date", { mode: 'timestamp_ms' }),
  notes: text("notes"),
  partsUsed: text("parts_used", { mode: 'json' }), // Array of part IDs and quantities
  cost: real("cost"), // Cost of maintenance
  bill: text("bill", { mode: 'json' }), // Bill details including items, labor, etc.
  billImageUrl: text("bill_image_url"), // Image of receipt/bill
  isUnscheduled: integer("is_unscheduled", { mode: 'boolean' }).default(false), // Whether this was an unscheduled maintenance
  approvalStatus: text("approval_status"), // 'pending', 'approved', 'rejected' (for unscheduled maintenance)
  approvedBy: integer("approved_by", { mode: 'number' }).references(() => users.id), // Who approved the unscheduled maintenance
});

// Define the structure for partsUsed and bill JSON fields
const partsUsedSchema = z.array(z.object({ partId: z.number(), quantity: z.number() })).nullable();
const billSchema = z.object({ /* Define bill structure here if needed */ }).nullable(); // Example: { items: z.array(...), labor: z.number() }

export const insertMaintenanceSchema = createInsertSchema(maintenance, {
  vehicleId: z.number().int(),
  assignedTo: z.number().int().optional().nullable(),
  cost: z.number().optional().nullable(),
  approvedBy: z.number().int().optional().nullable(),
  dueDate: z.date(), // Expect Date for insertion
  completedDate: z.date().optional().nullable(),
  partsUsed: partsUsedSchema, // Use the defined schema
  bill: billSchema, // Use the defined schema
}).omit({
  id: true,
});
export const selectMaintenanceSchema = createSelectSchema(maintenance, {
  dueDate: z.date(),
  completedDate: z.date().nullable(),
  partsUsed: partsUsedSchema, // Use the defined schema
  bill: billSchema, // Use the defined schema
});

// Notifications Schema
export const notifications = sqliteTable("notifications", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id", { mode: 'number' }).references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'maintenance', 'approval', 'assignment', etc.
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull(),
  relatedId: integer("related_id", { mode: 'number' }), // ID of the related entity
  relatedType: text("related_type"), // Type of the related entity
  link: text("link"), // Link to navigate to in the app
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  userId: z.number().int(),
  relatedId: z.number().int().optional().nullable(),
  createdAt: z.date(),
}).omit({
  id: true,
});
export const selectNotificationSchema = createSelectSchema(notifications, {
  createdAt: z.date(),
});

// Orders Schema
export const orders = sqliteTable("orders", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull(), // 'pending', 'approved', 'ordered', 'received', 'cancelled'
  createdDate: integer("created_date", { mode: 'timestamp_ms' }).notNull(),
  orderedDate: integer("ordered_date", { mode: 'timestamp_ms' }),
  receivedDate: integer("received_date", { mode: 'timestamp_ms' }),
  createdBy: integer("created_by", { mode: 'number' }).references(() => users.id).notNull(),
  supplier: text("supplier"),
  totalAmount: real("total_amount"),
  notes: text("notes"),
});

export const insertOrderSchema = createInsertSchema(orders, {
  createdBy: z.number().int(),
  totalAmount: z.number().optional().nullable(),
  createdDate: z.date(),
  orderedDate: z.date().optional().nullable(),
  receivedDate: z.date().optional().nullable(),
}).omit({
  id: true,
  orderNumber: true, // Generated dynamically
});
export const selectOrderSchema = createSelectSchema(orders, {
  createdDate: z.date(),
  orderedDate: z.date().nullable(),
  receivedDate: z.date().nullable(),
});

// Order Items Schema
export const orderItems = sqliteTable("order_items", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  orderId: integer("order_id", { mode: 'number' }).references(() => orders.id).notNull(),
  partId: integer("part_id", { mode: 'number' }).references(() => parts.id).notNull(),
  quantity: integer("quantity", { mode: 'number' }).notNull(),
  price: real("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  orderId: z.number().int(),
  partId: z.number().int(),
  quantity: z.number().int(),
  price: z.number(),
}).omit({
  id: true,
});
export const selectOrderItemSchema = createSelectSchema(orderItems);

// Activity Log Schema
export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id", { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id", { mode: 'number' }).references(() => users.id).notNull(),
  action: text("action").notNull(), // 'maintenance_completed', 'part_added', 'order_placed', etc.
  description: text("description").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp_ms' }).notNull(),
  relatedId: integer("related_id", { mode: 'number' }), // ID of the related entity (vehicle, part, etc.)
  relatedType: text("related_type"), // Type of the related entity ('vehicle', 'part', etc.)
});

export const insertActivityLogSchema = createInsertSchema(activityLogs, {
  userId: z.number().int(),
  relatedId: z.number().int().optional().nullable(),
  timestamp: z.date(),
}).omit({
  id: true,
});
export const selectActivityLogSchema = createSelectSchema(activityLogs, {
  timestamp: z.date(),
});


// Export types using the select schemas for proper Date types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = z.infer<typeof selectVehicleSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type VehiclePart = z.infer<typeof selectVehiclePartSchema>;
export type InsertVehiclePart = z.infer<typeof insertVehiclePartSchema>;

export type Part = z.infer<typeof selectPartSchema>;
export type InsertPart = z.infer<typeof insertPartSchema>;

export type Maintenance = z.infer<typeof selectMaintenanceSchema>;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Notification = z.infer<typeof selectNotificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Order = z.infer<typeof selectOrderSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = z.infer<typeof selectOrderItemSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type ActivityLog = z.infer<typeof selectActivityLogSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;