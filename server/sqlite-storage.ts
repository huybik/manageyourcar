
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
  selectMaintenanceSchema, // Import select schema for parsing
  selectPartSchema, // Import select schema for parsing
} from "@shared/schema";
import { format } from "date-fns";
import { db } from "./db";
import { eq, and, desc, asc, lt, gte, gt, or, isNull, sql } from "drizzle-orm";
import { IStorage } from "./storage.types"; // Import from the new types file

// Helper function to safely parse JSON fields
function parseJsonField<T>(data: unknown, defaultValue: T | null = null): T | null {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error("Failed to parse JSON field:", e);
      return defaultValue;
    }
  }
  // If it's already an object (might happen with some drivers/configs), return it
  if (typeof data === 'object' && data !== null) {
    // Attempt to validate against a known structure if possible, otherwise return as is
    // For simplicity here, we assume it's the correct type if it's already an object
    return data as T;
  }
  return defaultValue;
}


export class SQLiteStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.query.users.findMany();
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
    return await db.query.vehicles.findFirst({
      where: eq(vehicles.id, id),
    });
  }

  async getVehicles(): Promise<Vehicle[]> {
    return await db.query.vehicles.findMany();
  }

  async getVehiclesByUser(userId: number): Promise<Vehicle[]> {
    return await db.query.vehicles.findMany({
      where: eq(vehicles.assignedTo, userId),
    });
  }

  async getVehicleByQrCode(qrCode: string): Promise<Vehicle | undefined> {
    return await db.query.vehicles.findFirst({
      where: eq(vehicles.qrCode, qrCode),
    });
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
    return await db.query.vehicleParts.findFirst({
      where: eq(vehicleParts.id, id),
    });
  }

  async getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]> {
    return await db.query.vehicleParts.findMany({
      where: eq(vehicleParts.vehicleId, vehicleId),
    });
  }

  async getVehiclePartsByPart(partId: number): Promise<VehiclePart[]> {
    return await db.query.vehicleParts.findMany({
      where: eq(vehicleParts.partId, partId),
    });
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
    const todayTimestamp = new Date(); // Use Date object for comparison
    
    // Get parts with a date-based maintenance need
    const dateMaintenance = await db.select()
      .from(vehicleParts)
      .where(and(
        eq(isNull(vehicleParts.nextMaintenanceDate), false),
        lt(vehicleParts.nextMaintenanceDate, todayTimestamp) // Compare directly with Date
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
    const combinedIds = new Set(dateMaintenance.map(p => p.id));
    for (const part of filteredMileage) {
      if (!combinedIds.has(part.id)) {
        combinedResults.push(part);
        combinedIds.add(part.id);
      }
    }
    
    return combinedResults;
  }

  // Part methods
  async getPart(id: number): Promise<Part | undefined> {
    const rawPart = await db.query.parts.findFirst({
      where: eq(parts.id, id),
    });
    if (!rawPart) return undefined;
    // Manually parse JSON field
    return {
      ...rawPart,
      compatibleVehicles: parseJsonField<string[]>(rawPart.compatibleVehicles, [])
    };
  }

  async getPartBySku(sku: string): Promise<Part | undefined> {
     const rawPart = await db.query.parts.findFirst({
      where: eq(parts.sku, sku),
    });
     if (!rawPart) return undefined;
     return {
       ...rawPart,
       compatibleVehicles: parseJsonField<string[]>(rawPart.compatibleVehicles, [])
     };
  }

  async getParts(): Promise<Part[]> {
    const rawParts = await db.query.parts.findMany();
    return rawParts.map(part => ({
      ...part,
      compatibleVehicles: parseJsonField<string[]>(part.compatibleVehicles, [])
    }));
  }

  async getStandardParts(): Promise<Part[]> {
    const rawParts = await db.query.parts.findMany({
      where: eq(parts.isStandard, true),
    });
    return rawParts.map(part => ({
      ...part,
      compatibleVehicles: parseJsonField<string[]>(part.compatibleVehicles, [])
    }));
  }

  async getCustomParts(): Promise<Part[]> {
    const rawParts = await db.query.parts.findMany({
      where: eq(parts.isStandard, false),
    });
    return rawParts.map(part => ({
      ...part,
      compatibleVehicles: parseJsonField<string[]>(part.compatibleVehicles, [])
    }));
  }
  
  async getLowStockParts(): Promise<Part[]> {
    // Parts with quantity less than minimumStock are considered low stock
    const rawParts = await db.select()
      .from(parts)
      .where(
        and(
          lt(parts.quantity, parts.minimumStock),
          gt(parts.minimumStock, 0)
        )
      );
    return rawParts.map(part => ({
      ...part,
      compatibleVehicles: parseJsonField<string[]>(part.compatibleVehicles, [])
    }));
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    // Drizzle with { mode: 'json' } handles stringification
    const dataToInsert = {
      ...insertPart,
      // Pass the array directly or null
      compatibleVehicles: insertPart.compatibleVehicles ?? null
    };
    const result = await db.insert(parts).values(dataToInsert).returning();
    return {
        ...result[0],
        compatibleVehicles: parseJsonField<string[]>(result[0].compatibleVehicles, [])
    };
  }

  async updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined> {
     // Drizzle with { mode: 'json' } handles stringification
     const dataToUpdate: Record<string, any> = { ...part };
     if (part.compatibleVehicles !== undefined) {
         // Pass the array directly or null
         dataToUpdate.compatibleVehicles = part.compatibleVehicles ?? null;
     }

    const result = await db.update(parts)
      .set(dataToUpdate)
      .where(eq(parts.id, id))
      .returning();

    if (!result[0]) return undefined;
    return {
        ...result[0],
        compatibleVehicles: parseJsonField<string[]>(result[0].compatibleVehicles, [])
    };
  }

  async deletePart(id: number): Promise<boolean> {
    const result = await db.delete(parts).where(eq(parts.id, id)).returning();
    return result.length > 0;
  }

  // Maintenance methods
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    const rawMaintenance = await db.query.maintenance.findFirst({
      where: eq(maintenance.id, id),
    });
    if (!rawMaintenance) return undefined;
    // Manually parse JSON fields
    return {
      ...rawMaintenance,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(rawMaintenance.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(rawMaintenance.bill)
    };
  }

  async getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    const rawMaintenanceList = await db.query.maintenance.findMany({
      where: eq(maintenance.vehicleId, vehicleId),
    });
    return rawMaintenanceList.map(m => ({
      ...m,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(m.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(m.bill)
    }));
  }

  async getMaintenanceTasks(): Promise<Maintenance[]> {
    const rawMaintenanceList = await db.query.maintenance.findMany();
     return rawMaintenanceList.map(m => ({
      ...m,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(m.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(m.bill)
    }));
  }

  async getPendingMaintenance(): Promise<Maintenance[]> {
    const rawMaintenanceList = await db.query.maintenance.findMany({
      where: or(
        eq(maintenance.status, "pending"),
        eq(maintenance.status, "overdue")
      ),
    });
     return rawMaintenanceList.map(m => ({
      ...m,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(m.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(m.bill)
    }));
  }
  
  async getUnscheduledMaintenance(): Promise<Maintenance[]> {
    const rawMaintenanceList = await db.query.maintenance.findMany({
      where: eq(maintenance.isUnscheduled, true),
    });
     return rawMaintenanceList.map(m => ({
      ...m,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(m.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(m.bill)
    }));
  }
  
  async getPendingApprovalMaintenance(): Promise<Maintenance[]> {
    const rawMaintenanceList = await db.query.maintenance.findMany({
      where: and(
        eq(maintenance.isUnscheduled, true),
        eq(maintenance.approvalStatus, "pending")
      ),
    });
     return rawMaintenanceList.map(m => ({
      ...m,
      partsUsed: parseJsonField<Maintenance['partsUsed']>(m.partsUsed),
      bill: parseJsonField<Maintenance['bill']>(m.bill)
    }));
  }

  async createMaintenance(insertMaintenance: InsertMaintenance): Promise<Maintenance> {
     // Drizzle with { mode: 'json' } handles stringification
     const dataToInsert = {
       ...insertMaintenance,
       partsUsed: insertMaintenance.partsUsed ?? null, // Pass object/array directly
       bill: insertMaintenance.bill ?? null // Pass object/array directly
     };
    const result = await db.insert(maintenance).values(dataToInsert).returning();
    return {
        ...result[0],
        partsUsed: parseJsonField<Maintenance['partsUsed']>(result[0].partsUsed),
        bill: parseJsonField<Maintenance['bill']>(result[0].bill)
    };
  }

  async updateMaintenance(id: number, maintenanceData: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    // Drizzle with { mode: 'json' } handles stringification
    const dataToUpdate: Record<string, any> = { ...maintenanceData };
    if (maintenanceData.partsUsed !== undefined) {
        dataToUpdate.partsUsed = maintenanceData.partsUsed ?? null; // Pass object/array directly
    }
    if (maintenanceData.bill !== undefined) {
        dataToUpdate.bill = maintenanceData.bill ?? null; // Pass object/array directly
    }

    const result = await db.update(maintenance)
      .set(dataToUpdate)
      .where(eq(maintenance.id, id))
      .returning();

    if (!result[0]) return undefined;
    return {
        ...result[0],
        partsUsed: parseJsonField<Maintenance['partsUsed']>(result[0].partsUsed),
        bill: parseJsonField<Maintenance['bill']>(result[0].bill)
    };
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    const result = await db.delete(maintenance).where(eq(maintenance.id, id)).returning();
    return result.length > 0;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return await db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
    });
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ),
      orderBy: desc(notifications.createdAt),
    });
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
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });
  }

  async getOrders(): Promise<Order[]> {
    return await db.query.orders.findMany();
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Get the count of existing orders to generate the next ID
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const nextId = (countResult[0]?.count ?? 0) + 1;
    
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
    return await db.query.orderItems.findFirst({
      where: eq(orderItems.id, id),
    });
  }

  async getOrderItemsForOrder(orderId: number): Promise<OrderItem[]> {
    return await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });
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
    return await db.query.activityLogs.findFirst({
      where: eq(activityLogs.id, id),
    });
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.query.activityLogs.findMany({
      orderBy: desc(activityLogs.timestamp),
    });
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return await db.query.activityLogs.findMany({
      orderBy: desc(activityLogs.timestamp),
      limit: limit,
    });
  }

  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(insertActivityLog).returning();
    return result[0];
  }
}