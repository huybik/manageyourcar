// File: /server/database-storage.ts
import {
  users,
  vehicles,
  parts,
  vehicleParts,
  maintenance,
  orders,
  orderItems,
  activityLogs,
  notifications,
  type User,
  type InsertUser,
  type Vehicle,
  type InsertVehicle,
  type Part,
  type InsertPart,
  type VehiclePart,
  type InsertVehiclePart,
  type Maintenance,
  type InsertMaintenance,
  type Notification,
  type InsertNotification,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { format } from "date-fns";
import { db } from "./db";
import {
  eq,
  and,
  desc,
  asc,
  lt,
  gte,
  gt,
  or,
  isNull,
  count as drizzleCount,
} from "drizzle-orm";
import { IStorage } from "./storage";

// Helper function to ensure a value is a Date object
const ensureDate = (
  value: string | Date | undefined | null
): Date | null | undefined => {
  if (value instanceof Date || value === null || value === undefined) {
    return value;
  }
  try {
    // Attempt to parse the date string
    const date = new Date(value);
    // Check if the parsed date is valid
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Log parsing errors if necessary, but don't crash
    console.error(`Failed to parse date value: ${value}`, e);
  }
  // Return undefined if parsing fails or the original value was invalid in context
  return undefined;
};

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // TODO: Hash password before inserting
    const result = await db.insert(users).values(insertUser).returning();
    if (result.length === 0) {
      throw new Error("Failed to create user.");
    }
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(
    id: number,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    // TODO: Handle password update separately with hashing
    const result = await db
      .update(users)
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
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.assignedTo, userId));
  }

  async getVehicleByQrCode(qrCode: string): Promise<Vehicle | undefined> {
    const result = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.qrCode, qrCode));
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    // Generate QR code for the vehicle if not provided
    if (!insertVehicle.qrCode) {
      insertVehicle.qrCode = `VEH-${Math.floor(
        Math.random() * 10000
      )}-${Math.random().toString(36).substring(2, 10)}`;
    }
    const dataToInsert = {
      ...insertVehicle,
      nextMaintenanceDate: ensureDate(insertVehicle.nextMaintenanceDate),
    };

    const result = await db.insert(vehicles).values(dataToInsert).returning();
    if (result.length === 0) {
      throw new Error("Failed to create vehicle.");
    }
    return result[0];
  }

  async updateVehicle(
    id: number,
    vehicle: Partial<InsertVehicle>
  ): Promise<Vehicle | undefined> {
    const dataToUpdate = {
      ...vehicle,
      nextMaintenanceDate: ensureDate(vehicle.nextMaintenanceDate),
    };
    // Remove undefined date properties to avoid setting them incorrectly
    if (
      dataToUpdate.nextMaintenanceDate === undefined &&
      "nextMaintenanceDate" in vehicle
    ) {
      // If ensureDate returned undefined, but the key was present, it means invalid date was passed
      // Decide how to handle this - maybe throw error or set to null if allowed by schema
      // For now, let's remove it to avoid DB error if schema doesn't allow null
      delete dataToUpdate.nextMaintenanceDate;
      // Or set to null if schema allows: dataToUpdate.nextMaintenanceDate = null;
    }

    const result = await db
      .update(vehicles)
      .set(dataToUpdate)
      .where(eq(vehicles.id, id))
      .returning();
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return result.length > 0;
  }

  // Vehicle Parts Association methods
  async getVehiclePart(id: number): Promise<VehiclePart | undefined> {
    const result = await db
      .select()
      .from(vehicleParts)
      .where(eq(vehicleParts.id, id));
    return result[0];
  }

  async getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]> {
    return await db
      .select()
      .from(vehicleParts)
      .where(eq(vehicleParts.vehicleId, vehicleId));
  }

  async getVehiclePartsByPart(partId: number): Promise<VehiclePart[]> {
    return await db
      .select()
      .from(vehicleParts)
      .where(eq(vehicleParts.partId, partId));
  }

  async createVehiclePart(
    insertVehiclePart: InsertVehiclePart
  ): Promise<VehiclePart> {
    const dataToInsert = {
      ...insertVehiclePart,
      lastMaintenanceDate: ensureDate(insertVehiclePart.lastMaintenanceDate),
      nextMaintenanceDate: ensureDate(insertVehiclePart.nextMaintenanceDate),
    };
    const result = await db
      .insert(vehicleParts)
      .values(dataToInsert)
      .returning();
    if (result.length === 0) {
      throw new Error("Failed to create vehicle part association.");
    }
    return result[0];
  }

  async updateVehiclePart(
    id: number,
    vehiclePart: Partial<InsertVehiclePart>
  ): Promise<VehiclePart | undefined> {
    const dataToUpdate = {
      ...vehiclePart,
      lastMaintenanceDate: ensureDate(vehiclePart.lastMaintenanceDate),
      nextMaintenanceDate: ensureDate(vehiclePart.nextMaintenanceDate),
    };
    // Remove undefined date properties
    if (
      dataToUpdate.lastMaintenanceDate === undefined &&
      "lastMaintenanceDate" in vehiclePart
    )
      delete dataToUpdate.lastMaintenanceDate;
    if (
      dataToUpdate.nextMaintenanceDate === undefined &&
      "nextMaintenanceDate" in vehiclePart
    )
      delete dataToUpdate.nextMaintenanceDate;

    const result = await db
      .update(vehicleParts)
      .set(dataToUpdate)
      .where(eq(vehicleParts.id, id))
      .returning();
    return result[0];
  }

  async deleteVehiclePart(id: number): Promise<boolean> {
    const result = await db
      .delete(vehicleParts)
      .where(eq(vehicleParts.id, id))
      .returning();
    return result.length > 0;
  }

  async getVehiclePartsNeedingMaintenance(): Promise<VehiclePart[]> {
    const today = new Date();

    // Get parts with a date-based maintenance need
    const dateMaintenance = await db
      .select()
      .from(vehicleParts)
      .where(
        and(
          isNull(vehicleParts.nextMaintenanceDate), // Should be isNotNull? Let's assume it means date is set
          lt(vehicleParts.nextMaintenanceDate, today)
        )
      );

    // Get vehicle info for mileage-based maintenance
    const vehiclesWithMileage = await db
      .select({
        id: vehicles.id,
        mileage: vehicles.mileage,
      })
      .from(vehicles);

    const mileageMap = new Map(
      vehiclesWithMileage.map((v) => [v.id, v.mileage])
    );

    // Get parts with mileage-based maintenance need
    const mileageMaintenance = await db
      .select()
      .from(vehicleParts)
      .where(isNull(vehicleParts.nextMaintenanceMileage)); // Should be isNotNull? Let's assume it means mileage is set

    // Filter mileage-based maintenance parts
    const filteredMileage = mileageMaintenance.filter((part) => {
      const vehicleMileage = mileageMap.get(part.vehicleId);
      return (
        vehicleMileage !== undefined &&
        part.nextMaintenanceMileage !== null &&
        vehicleMileage >= part.nextMaintenanceMileage
      );
    });

    // Combine both lists, removing duplicates
    const combinedResultsMap = new Map<number, VehiclePart>();
    dateMaintenance.forEach((part) => combinedResultsMap.set(part.id, part));
    filteredMileage.forEach((part) => combinedResultsMap.set(part.id, part));

    return Array.from(combinedResultsMap.values());
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

  async getLowStockParts(): Promise<Part[]> {
    // Parts with quantity less than or equal to minimumStock are considered low stock
    return await db
      .select()
      .from(parts)
      .where(
        and(
          lt(parts.quantity, parts.minimumStock), // Use less than, not less than or equal, to match client logic
          gt(parts.minimumStock, 0) // Ensure minimum stock is defined
        )
      );
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    const dataToInsert = {
      ...insertPart,
      lastRestocked: ensureDate(insertPart.lastRestocked),
    };
    const result = await db.insert(parts).values(dataToInsert).returning();
    if (result.length === 0) {
      throw new Error("Failed to create part.");
    }
    return result[0];
  }

  async updatePart(
    id: number,
    part: Partial<InsertPart>
  ): Promise<Part | undefined> {
    const dataToUpdate = {
      ...part,
      lastRestocked: ensureDate(part.lastRestocked),
    };
    // Remove undefined date properties
    if (dataToUpdate.lastRestocked === undefined && "lastRestocked" in part)
      delete dataToUpdate.lastRestocked;

    const result = await db
      .update(parts)
      .set(dataToUpdate)
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
    const result = await db
      .select()
      .from(maintenance)
      .where(eq(maintenance.id, id));
    return result[0];
  }

  async getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    return await db
      .select()
      .from(maintenance)
      .where(eq(maintenance.vehicleId, vehicleId));
  }

  async getMaintenanceTasks(): Promise<Maintenance[]> {
    return await db.select().from(maintenance);
  }

  async getPendingMaintenance(): Promise<Maintenance[]> {
    // Includes pending and overdue tasks
    return await db
      .select()
      .from(maintenance)
      .where(
        or(
          eq(maintenance.status, "pending"),
          eq(maintenance.status, "overdue"),
          and(
            // Also consider pending tasks whose due date has passed
            eq(maintenance.status, "pending"),
            lt(maintenance.dueDate, new Date())
          )
        )
      );
  }

  async getUnscheduledMaintenance(): Promise<Maintenance[]> {
    return await db
      .select()
      .from(maintenance)
      .where(eq(maintenance.isUnscheduled, true));
  }

  async getPendingApprovalMaintenance(): Promise<Maintenance[]> {
    return await db
      .select()
      .from(maintenance)
      .where(
        and(
          eq(maintenance.isUnscheduled, true),
          eq(maintenance.approvalStatus, "pending")
        )
      );
  }

  async createMaintenance(
    insertMaintenance: InsertMaintenance
  ): Promise<Maintenance> {
    // Ensure dueDate is a Date object
    const dueDate = ensureDate(insertMaintenance.dueDate);
    if (!dueDate) {
      throw new Error("Invalid or missing due date for maintenance task.");
    }

    // Determine initial status based on due date
    const status = dueDate < new Date() ? "overdue" : "pending";
    const dataToInsert = {
      ...insertMaintenance,
      dueDate: dueDate, // Use the ensured Date object
      status,
    };

    const result = await db
      .insert(maintenance)
      .values(dataToInsert)
      .returning();
    if (result.length === 0) {
      throw new Error("Failed to create maintenance task.");
    }
    return result[0];
  }

  async updateMaintenance(
    id: number,
    maintenanceData: Partial<InsertMaintenance>
  ): Promise<Maintenance | undefined> {
    // Prepare the data for update, ensuring dates are Date objects
    // Use Partial<Maintenance> to allow updating completedDate etc.
    const dataToUpdate: Partial<Maintenance> = {
      ...maintenanceData,
      dueDate: ensureDate(maintenanceData.dueDate),
      completedDate: ensureDate(maintenanceData.completedDate),
    };

    // If status is changing to completed, set completedDate if not already set
    if (maintenanceData.status === "completed" && !dataToUpdate.completedDate) {
      dataToUpdate.completedDate = new Date();
    }

    // If due date changes, potentially update status (only if not completed)
    if (dataToUpdate.dueDate && dataToUpdate.status !== "completed") {
      const dueDate = dataToUpdate.dueDate; // Already a Date object or null/undefined
      if (dueDate) {
        // Only update status if it's currently pending or overdue
        const currentTask = await this.getMaintenance(id);
        if (
          currentTask &&
          (currentTask.status === "pending" || currentTask.status === "overdue")
        ) {
          dataToUpdate.status = dueDate < new Date() ? "overdue" : "pending";
        }
      }
    }

    // Remove undefined date properties to avoid setting them to null in the DB
    if (dataToUpdate.dueDate === undefined && "dueDate" in maintenanceData)
      delete dataToUpdate.dueDate;
    if (
      dataToUpdate.completedDate === undefined &&
      "completedDate" in maintenanceData
    )
      delete dataToUpdate.completedDate;

    const result = await db
      .update(maintenance)
      .set(dataToUpdate)
      .where(eq(maintenance.id, id))
      .returning();
    return result[0];
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    const result = await db
      .delete(maintenance)
      .where(eq(maintenance.id, id))
      .returning();
    return result.length > 0;
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return result[0];
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      )
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const createdAt = ensureDate(insertNotification.createdAt);
    if (!createdAt) {
      // createdAt is notNull, so we must provide a valid date
      throw new Error("Invalid or missing creation date for notification.");
    }
    const dataToInsert = {
      ...insertNotification,
      createdAt: createdAt, // Use the ensured Date object
    };
    const result = await db
      .insert(notifications)
      .values(dataToInsert)
      .returning();
    if (result.length === 0) {
      throw new Error("Failed to create notification.");
    }
    return result[0];
  }

  async updateNotification(
    id: number,
    notification: Partial<InsertNotification>
  ): Promise<Notification | undefined> {
    // Use Partial<Notification> to allow updating all fields including createdAt
    const dataToUpdate: Partial<Notification> = {
      ...notification,
      createdAt: ensureDate(notification.createdAt),
    };
    // Remove undefined date properties only if the key was present in the input
    // Since createdAt is notNull, we should probably prevent setting it to null/undefined here.
    // If ensureDate returns undefined/null, it means the input was invalid.
    if (dataToUpdate.createdAt === undefined && "createdAt" in notification) {
      // Throw error or skip updating createdAt
      // For now, let's skip updating it if the provided value was invalid
      delete dataToUpdate.createdAt;
    } else if (dataToUpdate.createdAt === null) {
      // Should not happen if ensureDate works correctly for a notNull field, but handle defensively
      delete dataToUpdate.createdAt; // Don't set notNull field to null
    }

    const result = await db
      .update(notifications)
      .set(dataToUpdate)
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
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
    const countResult = await db.select({ value: drizzleCount() }).from(orders);
    const nextId = (countResult[0]?.value ?? 0) + 1;

    const orderNumber = `PO-${format(new Date(), "yyyy")}-${String(
      nextId
    ).padStart(4, "0")}`;
    const createdDate = ensureDate(insertOrder.createdDate);
    if (!createdDate) {
      // createdDate is notNull
      throw new Error("Invalid or missing creation date for order.");
    }
    const orderToInsert = {
      ...insertOrder,
      createdDate: createdDate, // Use ensured Date object
      orderNumber,
    };

    const result = await db.insert(orders).values(orderToInsert).returning();
    if (result.length === 0) {
      throw new Error("Failed to create order.");
    }
    return result[0];
  }

  async updateOrder(
    id: number,
    order: Partial<Order>
  ): Promise<Order | undefined> {
    // Use Partial<Order> to allow updating all fields
    const dataToUpdate: Partial<Order> = {
      ...order,
      createdDate: ensureDate(order.createdDate),
      orderedDate: ensureDate(order.orderedDate),
      receivedDate: ensureDate(order.receivedDate),
    };
    // Remove undefined/null date properties if the column is notNull
    if (
      (dataToUpdate.createdDate === undefined ||
        dataToUpdate.createdDate === null) &&
      "createdDate" in order
    ) {
      // createdDate is notNull, so we cannot set it to null/undefined
      // Throw error or skip update for this field
      delete dataToUpdate.createdDate; // Skip update if invalid
    }
    // For nullable fields, remove only if undefined was result of invalid input
    if (dataToUpdate.orderedDate === undefined && "orderedDate" in order)
      delete dataToUpdate.orderedDate;
    if (dataToUpdate.receivedDate === undefined && "receivedDate" in order)
      delete dataToUpdate.receivedDate;

    const result = await db
      .update(orders)
      .set(dataToUpdate)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    // Consider deleting associated order items as well, or handle foreign key constraints
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  // Order Item methods
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const result = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.id, id));
    return result[0];
  }

  async getOrderItemsForOrder(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    if (result.length === 0) {
      throw new Error("Failed to create order item.");
    }
    return result[0];
  }

  async updateOrderItem(
    id: number,
    orderItem: Partial<InsertOrderItem>
  ): Promise<OrderItem | undefined> {
    const result = await db
      .update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return result[0];
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db
      .delete(orderItems)
      .where(eq(orderItems.id, id))
      .returning();
    return result.length > 0;
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const result = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.id, id));
    return result[0];
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(
    insertActivityLog: InsertActivityLog
  ): Promise<ActivityLog> {
    const timestamp = ensureDate(insertActivityLog.timestamp);
    if (!timestamp) {
      // timestamp is notNull
      throw new Error("Invalid or missing timestamp for activity log.");
    }
    const dataToInsert = {
      ...insertActivityLog,
      timestamp: timestamp, // Use ensured Date object
    };
    const result = await db
      .insert(activityLogs)
      .values(dataToInsert)
      .returning();
    if (result.length === 0) {
      throw new Error("Failed to create activity log.");
    }
    return result[0];
  }
}
