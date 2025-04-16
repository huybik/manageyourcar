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
  quantity: integer("quantity").notNull(),
  minimumStock: integer("minimum_stock").notNull(),
  price: real("price").notNull(),
  supplier: text("supplier"),
  location: text("location"),
  compatibleVehicles: json("compatible_vehicles"),
  lastRestocked: timestamp("last_restocked"),
});

export const insertPartSchema = createInsertSchema(parts).omit({
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
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  completedDate: true,
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

export type Part = typeof parts.$inferSelect;
export type InsertPart = z.infer<typeof insertPartSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
