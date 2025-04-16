import {
  users, vehicles, parts, vehicleParts, maintenance, orders, orderItems, activityLogs, notifications,
  type User, type InsertUser,
  type Vehicle, type InsertVehicle,
  type Part, type InsertPart,
  type VehiclePart, type InsertVehiclePart,
  type Maintenance, type InsertMaintenance,
  type Notification, type InsertNotification,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type ActivityLog, type InsertActivityLog,
} from "@shared/schema";
import { format } from "date-fns";
import { db } from "./db";
import { eq, and, desc, asc, lt, gte, or, isNull } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehiclesByUser(userId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.assignedTo, userId));
  }

  async getVehicleByQrCode(qrCode: string): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.qrCode, qrCode));
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    // Generate QR code for the vehicle if not provided
    if (!insertVehicle.qrCode) {
      insertVehicle.qrCode = `VEH-${Math.floor(Math.random() * 10000)}-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    const result = await db.insert(vehicles).values(insertVehicle).returning();
    return result[0];
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }
  
  // Vehicle Parts Association methods
  async getVehiclePart(id: number): Promise<VehiclePart | undefined> {
    const result = await db.select().from(vehicleParts).where(eq(vehicleParts.id, id));
    return result[0];
  }

  async getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]> {
    return await db.select().from(vehicleParts).where(eq(vehicleParts.vehicleId, vehicleId));
  }

  async getVehiclePartsByPart(partId: number): Promise<VehiclePart[]> {
    return await db.select().from(vehicleParts).where(eq(vehicleParts.partId, partId));
  }

  async createVehiclePart(insertVehiclePart: InsertVehiclePart): Promise<VehiclePart> {
    const result = await db.insert(vehicleParts).values(insertVehiclePart).returning();
    return result[0];
  }

  async updateVehiclePart(id: number, vehiclePart: Partial<InsertVehiclePart>): Promise<VehiclePart | undefined> {
    const result = await db.update(vehicleParts)
      .set(vehiclePart)
      .where(eq(vehicleParts.id, id))
      .returning();
    return result[0];
  }

  async deleteVehiclePart(id: number): Promise<boolean> {
    const result = await db.delete(vehicleParts).where(eq(vehicleParts.id, id)).returning();
    return result.length > 0;
  }

  async getVehiclePartsNeedingMaintenance(): Promise<VehiclePart[]> {
    const today = new Date();
    
    // Get parts with a date-based maintenance need
    const dateMaintenance = await db.select()
      .from(vehicleParts)
      .where(and(
        eq(isNull(vehicleParts.nextMaintenanceDate), false),
        lt(vehicleParts.nextMaintenanceDate, today)
      ));
    
    // Get vehicle info for mileage-based maintenance
    const vehiclesWithMileage = await db.select({
      id: vehicles.id,
      mileage: vehicles.mileage
    }).from(vehicles);
    
    const mileageMap = new Map(vehiclesWithMileage.map(v => [v.id, v.mileage]));
    
    // Get parts with mileage-based maintenance need
    const mileageMaintenance = await db.select()
      .from(vehicleParts)
      .where(eq(isNull(vehicleParts.nextMaintenanceMileage), false));
    
    // Filter mileage-based maintenance parts
    const filteredMileage = mileageMaintenance.filter(part => {
      const vehicleMileage = mileageMap.get(part.vehicleId);
      return vehicleMileage !== undefined && 
             part.nextMaintenanceMileage !== null && 
             vehicleMileage >= part.nextMaintenanceMileage;
    });
    
    // Combine both lists, removing duplicates
    const combinedResults = [...dateMaintenance];
    for (const part of filteredMileage) {
      if (!combinedResults.some(p => p.id === part.id)) {
        combinedResults.push(part);
      }
    }
    
    return combinedResults;
  }

  // Part methods
  async getPart(id: number): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.id, id));
    return result[0];
  }

  async getPartBySku(sku: string): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.sku, sku));
    return result[0];
  }

  async getParts(): Promise<Part[]> {
    return await db.select().from(parts);
  }

  async getStandardParts(): Promise<Part[]> {
    return await db.select().from(parts).where(eq(parts.isStandard, true));
  }

  async getCustomParts(): Promise<Part[]> {
    return await db.select().from(parts).where(eq(parts.isStandard, false));
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    const result = await db.insert(parts).values(insertPart).returning();
    return result[0];
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
    const result = await db.update(parts)
      .set(part)
      .where(eq(parts.id, id))
      .returning();
    return result[0];
  }

  async deletePart(id: number): Promise<boolean> {
    const result = await db.delete(parts).where(eq(parts.id, id)).returning();
    return result.length > 0;
  }

  // Maintenance methods
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
    return result[0];
  }

  async getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.vehicleId, vehicleId));
  }

  async getMaintenanceTasks(): Promise<Maintenance[]> {
    return await db.select().from(maintenance);
  }

  async getPendingMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(
      or(
        eq(maintenance.status, "pending"),
        eq(maintenance.status, "overdue")
      )
    );
  }
  
  async getUnscheduledMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.isUnscheduled, true));
  }
  
  async getPendingApprovalMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(
      and(
        eq(maintenance.isUnscheduled, true),
        eq(maintenance.approvalStatus, "pending")
      )
    );
  }

  async createMaintenance(insertMaintenance: InsertMaintenance): Promise<Maintenance> {
    const result = await db.insert(maintenance).values(insertMaintenance).returning();
    return result[0];
  }

  async updateMaintenance(id: number, maintenanceData: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    const result = await db.update(maintenance)
      .set(maintenanceData)
      .where(eq(maintenance.id, id))
      .returning();
    return result[0];
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    const result = await db.delete(maintenance).where(eq(maintenance.id, id)).returning();
    return result.length > 0;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db.select().from(notifications).where(eq(notifications.id, id));
    return result[0];
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set(notification)
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id)).returning();
    return result.length > 0;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Get next ID to generate order number
    const countResult = await db.select({ count: orders.id }).from(orders);
    const nextId = (countResult.length > 0 ? parseInt(countResult[0].count.toString()) : 0) + 1;
    
    const orderNumber = `PO-${format(new Date(), "yyyy")}-${String(nextId).padStart(4, "0")}`;
    const orderToInsert = {
      ...insertOrder,
      orderNumber
    };
    
    const result = await db.insert(orders).values(orderToInsert).returning();
    return result[0];
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  // Order Item methods
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const result = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return result[0];
  }

  async getOrderItemsForOrder(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(insertOrderItem).returning();
    return result[0];
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const result = await db.update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return result[0];
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id)).returning();
    return result.length > 0;
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const result = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return result[0];
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(insertActivityLog).returning();
    return result[0];
  }
}