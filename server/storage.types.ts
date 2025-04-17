
import {
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

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Vehicles
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByUser(userId: number): Promise<Vehicle[]>;
  getVehicleByQrCode(qrCode: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Vehicle Parts Association
  getVehiclePart(id: number): Promise<VehiclePart | undefined>;
  getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]>;
  getVehiclePartsByPart(partId: number): Promise<VehiclePart[]>;
  createVehiclePart(vehiclePart: InsertVehiclePart): Promise<VehiclePart>;
  updateVehiclePart(id: number, vehiclePart: Partial<InsertVehiclePart>): Promise<VehiclePart | undefined>;
  deleteVehiclePart(id: number): Promise<boolean>;
  getVehiclePartsNeedingMaintenance(): Promise<VehiclePart[]>;

  // Parts
  getPart(id: number): Promise<Part | undefined>;
  getPartBySku(sku: string): Promise<Part | undefined>;
  getParts(): Promise<Part[]>;
  getStandardParts(): Promise<Part[]>;
  getCustomParts(): Promise<Part[]>;
  getLowStockParts(): Promise<Part[]>;
  createPart(part: InsertPart): Promise<Part>;
  updatePart(id: number, part: Partial<InsertPart>): Promise<Part | undefined>;
  deletePart(id: number): Promise<boolean>;

  // Maintenance
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]>;
  getMaintenanceTasks(): Promise<Maintenance[]>;
  getPendingMaintenance(): Promise<Maintenance[]>;
  getUnscheduledMaintenance(): Promise<Maintenance[]>;
  getPendingApprovalMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(id: number, maintenance: Partial<InsertMaintenance>): Promise<Maintenance | undefined>;
  deleteMaintenance(id: number): Promise<boolean>;

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<InsertNotification>): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsForOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
}