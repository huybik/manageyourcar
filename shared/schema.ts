import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'company_admin', 'driver'
  email: text("email"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  notificationEnabled: boolean("notification_enabled").default(true),
  fcmToken: text("fcm_token"), // For push notifications
});

export const insertUserSchema = createInsertSchema(users).omit({
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
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  nextMaintenanceMileage: integer("next_maintenance_mileage"),
  qrCode: text("qr_code"), // QR code for vehicle identification/scanning
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
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
  supplier: text("supplier"),
  location: text("location"),
  imageUrl: text("image_url"),
  maintenanceInterval: integer("maintenance_interval"), // Default miles between maintenance
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
});

// Vehicle-Parts Association Schema
export const vehicleParts = pgTable("vehicle_parts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  isCustom: boolean("is_custom").default(false), // Whether this is a custom part for this vehicle
  maintenanceInterval: integer("maintenance_interval"), // Miles between maintenance
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  lastMaintenanceMileage: integer("last_maintenance_mileage"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  nextMaintenanceMileage: integer("next_maintenance_mileage"),
  notes: text("notes"),
});

export const insertVehiclePartSchema = createInsertSchema(vehicleParts).omit({
  id: true,
});

// Maintenance Schema
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  type: text("type").notNull(), // 'oil_change', 'brake_inspection', 'tire_rotation', etc.
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull(), // 'pending', 'scheduled', 'completed', 'overdue'
  priority: text("priority").notNull(), // 'low', 'normal', 'high', 'critical'
  assignedTo: integer("assigned_to").references(() => users.id),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  partsUsed: json("parts_used"), // Array of part IDs and quantities
  cost: real("cost"), // Cost of maintenance
  bill: json("bill"), // Bill details including items, labor, etc.
  billImageUrl: text("bill_image_url"), // Image of receipt/bill
  isUnscheduled: boolean("is_unscheduled").default(false), // Whether this was an unscheduled maintenance
  approvalStatus: text("approval_status"), // 'pending', 'approved', 'rejected' (for unscheduled maintenance)
  approvedBy: integer("approved_by").references(() => users.id), // Who approved the unscheduled maintenance
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  completedDate: true,
});

// Notifications Schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'maintenance', 'approval', 'assignment', etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull(),
  relatedId: integer("related_id"), // ID of the related entity
  relatedType: text("related_type"), // Type of the related entity
  link: text("link"), // Link to navigate to in the app
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
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
  createdBy: integer("created_by").references(() => users.id).notNull(),
  supplier: text("supplier"),
  totalAmount: real("total_amount"),
  notes: text("notes"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  orderedDate: true,
  receivedDate: true,
});

// Order Items Schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  partId: integer("part_id").references(() => parts.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Activity Log Schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // 'maintenance_completed', 'part_added', 'order_placed', etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  relatedId: integer("related_id"), // ID of the related entity (vehicle, part, etc.)
  relatedType: text("related_type"), // Type of the related entity ('vehicle', 'part', etc.)
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type VehiclePart = typeof vehicleParts.$inferSelect;
export type InsertVehiclePart = z.infer<typeof insertVehiclePartSchema>;

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;

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