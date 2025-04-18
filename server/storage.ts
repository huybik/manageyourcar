/* /server/storage.ts */
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
  serviceSchedules,
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
  type ServiceSchedule,
  type InsertServiceSchedule,
} from "@shared/schema";
import { format, addDays } from "date-fns";

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
  updateVehicle(
    id: number,
    vehicle: Partial<InsertVehicle>
  ): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Vehicle Parts Association
  getVehiclePart(id: number): Promise<VehiclePart | undefined>;
  getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]>;
  getVehiclePartsByPart(partId: number): Promise<VehiclePart[]>;
  createVehiclePart(vehiclePart: InsertVehiclePart): Promise<VehiclePart>;
  updateVehiclePart(
    id: number,
    vehiclePart: Partial<InsertVehiclePart>
  ): Promise<VehiclePart | undefined>;
  deleteVehiclePart(id: number): Promise<boolean>;
  getVehiclePartsNeedingMaintenance(
    vehicleIds?: number[]
  ): Promise<VehiclePart[]>; // Added optional filter

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

  // Service Schedules
  getServiceSchedule(id: number): Promise<ServiceSchedule | undefined>;
  getServiceSchedulesForVehicle(vehicleId: number): Promise<ServiceSchedule[]>;
  createServiceSchedule(
    schedule: InsertServiceSchedule
  ): Promise<ServiceSchedule>;
  updateServiceSchedule(
    id: number,
    schedule: Partial<InsertServiceSchedule>
  ): Promise<ServiceSchedule | undefined>;
  deleteServiceSchedule(id: number): Promise<boolean>;
  getServiceSchedulesNeedingMaintenance(
    vehicleIds?: number[]
  ): Promise<ServiceSchedule[]>; // Added optional filter

  // Maintenance
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]>;
  getMaintenanceTasks(): Promise<Maintenance[]>;
  getPendingMaintenance(): Promise<Maintenance[]>;
  getUnscheduledMaintenance(): Promise<Maintenance[]>;
  getPendingApprovalMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(
    id: number,
    maintenance: Partial<InsertMaintenance>
  ): Promise<Maintenance | undefined>;
  approveMaintenance(
    id: number,
    approverId: number
  ): Promise<Maintenance | undefined>; // New method
  rejectMaintenance(
    id: number,
    rejectorId: number
  ): Promise<Maintenance | undefined>; // New method
  deleteMaintenance(id: number): Promise<boolean>;

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(
    id: number,
    notification: Partial<InsertNotification>
  ): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;

  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(
    id: number,
    order: Partial<InsertOrder>
  ): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsForOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(
    id: number,
    orderItem: Partial<InsertOrderItem>
  ): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogs(): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
}

// Helper to calculate next maintenance date based on interval and last date
const calculateNextDate = (
  lastDate: Date | null | undefined,
  intervalDays: number | null | undefined
): Date | null => {
  if (!lastDate || !intervalDays || intervalDays <= 0) {
    return null;
  }
  return addDays(lastDate, intervalDays);
};

// Helper to calculate next maintenance mileage based on interval and last mileage
const calculateNextMileage = (
  lastMileage: number | null | undefined,
  intervalMileage: number | null | undefined
): number | null => {
  if (
    lastMileage === null ||
    lastMileage === undefined ||
    !intervalMileage ||
    intervalMileage <= 0
  ) {
    return null;
  }
  return lastMileage + intervalMileage;
};

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private parts: Map<number, Part>;
  private vehicleParts: Map<number, VehiclePart>;
  private serviceSchedules: Map<number, ServiceSchedule>; // Added
  private maintenanceTasks: Map<number, Maintenance>;
  private notifications: Map<number, Notification>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private activityLogs: Map<number, ActivityLog>;

  // Counters for auto-incrementation
  private userCounter: number;
  private vehicleCounter: number;
  private partCounter: number;
  private vehiclePartCounter: number;
  private serviceScheduleCounter: number; // Added
  private maintenanceCounter: number;
  private notificationCounter: number;
  private orderCounter: number;
  private orderItemCounter: number;
  private activityLogCounter: number;

  constructor() {
    // Initialize maps
    this.users = new Map();
    this.vehicles = new Map();
    this.parts = new Map();
    this.vehicleParts = new Map();
    this.serviceSchedules = new Map(); // Added
    this.maintenanceTasks = new Map();
    this.notifications = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.activityLogs = new Map();

    // Initialize counters
    this.userCounter = 1;
    this.vehicleCounter = 1;
    this.partCounter = 1;
    this.vehiclePartCounter = 1;
    this.serviceScheduleCounter = 1; // Added
    this.maintenanceCounter = 1;
    this.notificationCounter = 1;
    this.orderCounter = 1;
    this.orderItemCounter = 1;
    this.activityLogCounter = 1;

    // Initialize with seed data
    this.seedData();
  }

  // Seed the database with initial data
  private seedData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "password",
      name: "John Ritter",
      role: "company_admin",
      email: "admin@fleetmaster.com",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    };
    const admin = this.createUser(adminUser);

    // Create drivers
    const driver1: InsertUser = {
      username: "mjohnson",
      password: "password",
      name: "Mike Johnson",
      role: "driver",
      email: "mike@fleetmaster.com",
      profileImage:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    };
    const mike = this.createUser(driver1);

    const driver2: InsertUser = {
      username: "slee",
      password: "password",
      name: "Sarah Lee",
      role: "driver",
      email: "sarah@fleetmaster.com",
      profileImage:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    };
    const sarah = this.createUser(driver2);

    const driver3: InsertUser = {
      username: "dchen",
      password: "password",
      name: "David Chen",
      role: "driver",
      email: "david@fleetmaster.com",
      profileImage:
        "https://images.unsplash.com/photo-1528892952291-009c663ce843?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
    };
    const david = this.createUser(driver3);

    // Create vehicles
    const truck: InsertVehicle = {
      name: "Truck #103",
      type: "truck",
      vin: "WVWAA71K08W201030",
      licensePlate: "TRK-103",
      make: "Ford",
      model: "F-150",
      year: 2020,
      mileage: 45000,
      assignedTo: mike.id,
      status: "active",
    };
    const truckEntity = this.createVehicle(truck);

    const sedan: InsertVehicle = {
      name: "Sedan #087",
      type: "sedan",
      vin: "1HGCM82633A123456",
      licensePlate: "SED-087",
      make: "Honda",
      model: "Accord",
      year: 2021,
      mileage: 28000,
      assignedTo: sarah.id,
      status: "active",
    };
    const sedanEntity = this.createVehicle(sedan);

    const van: InsertVehicle = {
      name: "Van #042",
      type: "van",
      vin: "2T3BFREV5DW789012",
      licensePlate: "VAN-042",
      make: "Toyota",
      model: "Sienna",
      year: 2022,
      mileage: 15000,
      assignedTo: david.id,
      status: "active",
    };
    const vanEntity = this.createVehicle(van);

    // Create parts
    const oilFilters: InsertPart = {
      name: "Oil Filters (Premium)",
      sku: "OIL-FIL-P42",
      description: "Premium quality oil filters for all vehicle types",
      category: "Filters",
      quantity: 2,
      minimumStock: 20,
      price: 8.99,
      supplier: "AutoParts Inc.",
      location: "Shelf A1",
      compatibleVehicles: ["Ford", "Honda", "Toyota"],
      lastRestocked: new Date("2023-01-10"),
      maintenanceIntervalDays: 180, // 6 months
      maintenanceIntervalMileage: 5000,
    };
    const oilFilterPart = this.createPart(oilFilters);

    const brakePads: InsertPart = {
      name: "Brake Pads (Front)",
      sku: "BRK-PAD-F15",
      description: "Front brake pads for sedans and light trucks",
      category: "Brakes",
      quantity: 3,
      minimumStock: 15,
      price: 45.99,
      supplier: "BrakeMasters",
      location: "Shelf B3",
      compatibleVehicles: ["Honda", "Toyota", "Nissan"],
      lastRestocked: new Date("2023-01-05"),
      maintenanceIntervalMileage: 30000,
    };
    const brakePadPart = this.createPart(brakePads);

    const wiperBlades: InsertPart = {
      name: 'Wiper Blades (20")',
      sku: "WIP-BLD-20",
      description: "20-inch wiper blades for all weather conditions",
      category: "Exterior",
      quantity: 4,
      minimumStock: 10,
      price: 12.99,
      supplier: "CleanView Auto",
      location: "Shelf C2",
      compatibleVehicles: ["Ford", "Honda", "Toyota", "Chevrolet"],
      lastRestocked: new Date("2023-01-08"),
      maintenanceIntervalDays: 365, // 1 year
    };
    const wiperBladePart = this.createPart(wiperBlades);

    const airFilters: InsertPart = {
      name: "Air Filters",
      sku: "AIR-FIL-A23",
      description: "Engine air filters for improved performance",
      category: "Filters",
      quantity: 12,
      minimumStock: 8,
      price: 14.99,
      supplier: "AutoParts Inc.",
      location: "Shelf A2",
      compatibleVehicles: ["Ford", "Honda", "Toyota", "Nissan"],
      lastRestocked: new Date("2023-01-12"),
      maintenanceIntervalMileage: 15000,
    };
    const airFilterPart = this.createPart(airFilters);

    // Associate parts with vehicles
    this.createVehiclePart({
      vehicleId: truckEntity.id,
      partId: oilFilterPart.id,
      installationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
      installationMileage: 35000,
      lastMaintenanceDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // Same as install for simplicity
      lastMaintenanceMileage: 35000,
    });
    this.createVehiclePart({
      vehicleId: truckEntity.id,
      partId: brakePadPart.id,
      installationDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
      installationMileage: 15000,
    });
    this.createVehiclePart({
      vehicleId: sedanEntity.id,
      partId: wiperBladePart.id,
      installationDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), // 150 days ago
      installationMileage: 10000,
    });
    this.createVehiclePart({
      vehicleId: vanEntity.id,
      partId: airFilterPart.id,
      installationDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
      installationMileage: 5000,
    });

    // Create Service Schedules
    this.createServiceSchedule({
      vehicleId: truckEntity.id,
      description: "6-Month General Checkup",
      frequencyDays: 180,
      lastServiceDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
      lastServiceMileage: 35000,
    });
    this.createServiceSchedule({
      vehicleId: sedanEntity.id,
      description: "Annual Inspection",
      frequencyDays: 365,
      lastServiceDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
      lastServiceMileage: 10000,
    });
    this.createServiceSchedule({
      vehicleId: vanEntity.id,
      description: "10,000 Mile Service",
      frequencyMileage: 10000,
      lastServiceMileage: 5000,
    });

    // Create maintenance tasks (some triggered by parts/schedules, some unscheduled)
    const oilChange: InsertMaintenance = {
      vehicleId: truckEntity.id,
      vehiclePartId: 1, // Assuming first vehiclePart is oil filter for truck
      type: "part_maintenance",
      description: "Oil Change & Filter",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: "pending",
      priority: "normal",
      assignedTo: mike.id,
      notes: "Use synthetic oil for this vehicle",
      isUnscheduled: false,
    };
    const oilChangeTask = this.createMaintenance(oilChange);

    const brakeInspection: InsertMaintenance = {
      vehicleId: sedanEntity.id,
      type: "general_service", // Could be linked to a schedule or part
      description: "Brake Inspection",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: "scheduled",
      priority: "high",
      assignedTo: sarah.id,
      notes: "Customer reported squealing noise when braking",
      isUnscheduled: false,
    };
    const brakeInspectionTask = this.createMaintenance(brakeInspection);

    const tireRotation: InsertMaintenance = {
      vehicleId: vanEntity.id,
      serviceScheduleId: 3, // Assuming 3rd schedule is 10k mile service for van
      type: "general_service",
      description: "Tire Rotation",
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
      status: "pending", // Status might be pending even if overdue until addressed
      priority: "normal",
      assignedTo: david.id,
      notes: "Also check for unusual wear patterns",
      isUnscheduled: false,
    };
    const tireRotationTask = this.createMaintenance(tireRotation);

    // Unscheduled maintenance example
    const unscheduledRepair: InsertMaintenance = {
      vehicleId: truckEntity.id,
      type: "unscheduled_repair",
      description: "Check Engine Light On",
      status: "pending", // Pending approval
      priority: "high",
      assignedTo: mike.id,
      notes: "Light came on during route. Engine seems hesitant.",
      isUnscheduled: true,
      approvalStatus: "pending",
    };
    this.createMaintenance(unscheduledRepair);

    // Create notifications
    this.createNotification({
      userId: mike.id,
      title: "Maintenance Due Soon",
      message: "Oil change due in 7 days for Truck #103",
      type: "maintenance_due",
      createdAt: new Date(),
      relatedId: oilChangeTask.id,
      relatedType: "maintenance",
      link: `/maintenance`, // Link to driver maintenance page
    });

    this.createNotification({
      userId: sarah.id,
      title: "Urgent Maintenance Scheduled",
      message:
        "High priority brake inspection scheduled in 3 days for Sedan #087",
      type: "maintenance_scheduled",
      createdAt: new Date(),
      relatedId: brakeInspectionTask.id,
      relatedType: "maintenance",
      link: `/maintenance`,
    });

    this.createNotification({
      userId: david.id,
      title: "Overdue Maintenance",
      message: "Tire rotation is now overdue for Van #042",
      type: "maintenance_overdue",
      createdAt: new Date(),
      relatedId: tireRotationTask.id,
      relatedType: "maintenance",
      link: `/maintenance`,
    });

    this.createNotification({
      userId: admin.id, // Notify admin about unscheduled request
      title: "Maintenance Approval Required",
      message:
        "Mike Johnson reported an issue with Truck #103 (Check Engine Light)",
      type: "maintenance_approval_request",
      createdAt: new Date(),
      relatedId: 4, // ID of the unscheduled maintenance task
      relatedType: "maintenance",
      link: `/maintenance`, // Link to company maintenance page
    });

    // Create activity logs
    const activity1: InsertActivityLog = {
      userId: mike.id,
      action: "maintenance_completed",
      description: "Mike Johnson completed maintenance on Truck #103",
      timestamp: new Date(),
      relatedId: 1,
      relatedType: "vehicle",
    };
    this.createActivityLog(activity1);

    const activity2: InsertActivityLog = {
      userId: sarah.id,
      action: "inventory_added",
      description: "Sarah Lee added 24 new parts to inventory",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      relatedId: null,
      relatedType: "inventory",
    };
    this.createActivityLog(activity2);

    const activity3: InsertActivityLog = {
      userId: admin.id,
      action: "order_placed",
      description:
        "Admin placed order #PO-2023-0042 for oil filters and brake pads",
      timestamp: new Date("2023-01-17T09:30:00"),
      relatedId: null,
      relatedType: "order",
    };
    this.createActivityLog(activity3);

    const activity4: InsertActivityLog = {
      userId: david.id,
      action: "issue_reported",
      description: "David Chen reported issue with Van #042",
      timestamp: new Date("2023-01-16T15:45:00"),
      relatedId: 3,
      relatedType: "vehicle",
    };
    this.createActivityLog(activity4);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCounter++;
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email || null,
      phone: insertUser.phone || null,
      profileImage: insertUser.profileImage || null,
      notificationEnabled: insertUser.notificationEnabled ?? true,
      fcmToken: insertUser.fcmToken || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // User methods
  async updateUser(
    id: number,
    user: Partial<InsertUser>
  ): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehiclesByUser(userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.assignedTo === userId
    );
  }

  async getVehicleByQrCode(qrCode: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      (vehicle) => vehicle.qrCode === qrCode
    );
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCounter++;
    // Generate QR code for the vehicle if not provided
    const qrCode =
      insertVehicle.qrCode ||
      `VEH-${id}-${Math.random().toString(36).substring(2, 10)}`;
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      qrCode,
      licensePlate: insertVehicle.licensePlate || null,
      assignedTo: insertVehicle.assignedTo || null,
      // Removed nextMaintenanceDate/Mileage
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(
    id: number,
    vehicle: Partial<InsertVehicle>
  ): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) return undefined;

    const updatedVehicle = { ...existingVehicle, ...vehicle };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Vehicle Parts Association methods
  async getVehiclePart(id: number): Promise<VehiclePart | undefined> {
    return this.vehicleParts.get(id);
  }

  async getVehiclePartsByVehicle(vehicleId: number): Promise<VehiclePart[]> {
    return Array.from(this.vehicleParts.values()).filter(
      (vehiclePart) => vehiclePart.vehicleId === vehicleId
    );
  }

  async getVehiclePartsByPart(partId: number): Promise<VehiclePart[]> {
    return Array.from(this.vehicleParts.values()).filter(
      (vehiclePart) => vehiclePart.partId === partId
    );
  }

  async createVehiclePart(
    insertVehiclePart: InsertVehiclePart
  ): Promise<VehiclePart> {
    const id = this.vehiclePartCounter++;
    const vehiclePart: VehiclePart = {
      ...insertVehiclePart,
      id,
      isCustom: insertVehiclePart.isCustom ?? false,
      customMaintenanceIntervalDays:
        insertVehiclePart.customMaintenanceIntervalDays || null,
      customMaintenanceIntervalMileage:
        insertVehiclePart.customMaintenanceIntervalMileage || null,
      lastMaintenanceDate: insertVehiclePart.lastMaintenanceDate || null,
      lastMaintenanceMileage: insertVehiclePart.lastMaintenanceMileage || null,
      notes: insertVehiclePart.notes || null,
    };
    this.vehicleParts.set(id, vehiclePart);
    return vehiclePart;
  }

  async updateVehiclePart(
    id: number,
    vehiclePart: Partial<InsertVehiclePart>
  ): Promise<VehiclePart | undefined> {
    const existingVehiclePart = this.vehicleParts.get(id);
    if (!existingVehiclePart) return undefined;

    const updatedVehiclePart = { ...existingVehiclePart, ...vehiclePart };
    this.vehicleParts.set(id, updatedVehiclePart);
    return updatedVehiclePart;
  }

  async deleteVehiclePart(id: number): Promise<boolean> {
    return this.vehicleParts.delete(id);
  }

  async getVehiclePartsNeedingMaintenance(
    vehicleIds?: number[]
  ): Promise<VehiclePart[]> {
    const today = new Date();
    let filteredParts = Array.from(this.vehicleParts.values());

    if (vehicleIds && vehicleIds.length > 0) {
      filteredParts = filteredParts.filter((vp) =>
        vehicleIds.includes(vp.vehicleId)
      );
    }

    return filteredParts.filter((vehiclePart) => {
      const partInfo = this.parts.get(vehiclePart.partId);
      const vehicleInfo = this.vehicles.get(vehiclePart.vehicleId);
      if (!partInfo || !vehicleInfo) return false; // Need part and vehicle info

      const intervalDays =
        vehiclePart.customMaintenanceIntervalDays ??
        partInfo.maintenanceIntervalDays;
      const intervalMileage =
        vehiclePart.customMaintenanceIntervalMileage ??
        partInfo.maintenanceIntervalMileage;

      const lastMaintDate =
        vehiclePart.lastMaintenanceDate ?? vehiclePart.installationDate;
      const lastMaintMileage =
        vehiclePart.lastMaintenanceMileage ?? vehiclePart.installationMileage;

      let needsMaintenance = false;

      // Check date interval
      if (intervalDays && lastMaintDate) {
        const nextDueDate = calculateNextDate(lastMaintDate, intervalDays);
        if (nextDueDate && nextDueDate <= today) {
          needsMaintenance = true;
        }
      }

      // Check mileage interval (only if not already flagged by date)
      if (
        !needsMaintenance &&
        intervalMileage &&
        lastMaintMileage !== null &&
        vehicleInfo.mileage !== null
      ) {
        const nextDueMileage = calculateNextMileage(
          lastMaintMileage,
          intervalMileage
        );
        if (nextDueMileage && vehicleInfo.mileage >= nextDueMileage) {
          needsMaintenance = true;
        }
      }

      return needsMaintenance;
    });
  }

  // Part methods
  async getPart(id: number): Promise<Part | undefined> {
    return this.parts.get(id);
  }

  async getPartBySku(sku: string): Promise<Part | undefined> {
    return Array.from(this.parts.values()).find((part) => part.sku === sku);
  }

  async getParts(): Promise<Part[]> {
    return Array.from(this.parts.values());
  }

  async getStandardParts(): Promise<Part[]> {
    return Array.from(this.parts.values()).filter(
      (part) => part.isStandard === true
    );
  }

  async getCustomParts(): Promise<Part[]> {
    return Array.from(this.parts.values()).filter(
      (part) => part.isStandard === false
    );
  }

  async getLowStockParts(): Promise<Part[]> {
    return Array.from(this.parts.values()).filter((part) => {
      const quantity = part.quantity || 0;
      const minStock = part.minimumStock || 10;
      return quantity <= minStock; // Use <= to match client logic
    });
  }

  async createPart(insertPart: InsertPart): Promise<Part> {
    const id = this.partCounter++;
    const part: Part = {
      ...insertPart,
      id,
      description: insertPart.description || null,
      isStandard: insertPart.isStandard ?? true,
      quantity: insertPart.quantity ?? 0,
      minimumStock: insertPart.minimumStock ?? 10,
      supplier: insertPart.supplier || null,
      location: insertPart.location || null,
      imageUrl: insertPart.imageUrl || null,
      maintenanceIntervalDays: insertPart.maintenanceIntervalDays || null,
      maintenanceIntervalMileage: insertPart.maintenanceIntervalMileage || null,
      lastRestocked: insertPart.lastRestocked || null,
      compatibleVehicles: insertPart.compatibleVehicles || null,
    };
    this.parts.set(id, part);
    return part;
  }

  async updatePart(
    id: number,
    part: Partial<InsertPart>
  ): Promise<Part | undefined> {
    const existingPart = this.parts.get(id);
    if (!existingPart) return undefined;

    const updatedPart = { ...existingPart, ...part };
    this.parts.set(id, updatedPart);
    return updatedPart;
  }

  async deletePart(id: number): Promise<boolean> {
    return this.parts.delete(id);
  }

  // Service Schedule methods
  async getServiceSchedule(id: number): Promise<ServiceSchedule | undefined> {
    return this.serviceSchedules.get(id);
  }

  async getServiceSchedulesForVehicle(
    vehicleId: number
  ): Promise<ServiceSchedule[]> {
    return Array.from(this.serviceSchedules.values()).filter(
      (schedule) => schedule.vehicleId === vehicleId
    );
  }

  async createServiceSchedule(
    insertSchedule: InsertServiceSchedule
  ): Promise<ServiceSchedule> {
    const id = this.serviceScheduleCounter++;
    const schedule: ServiceSchedule = {
      ...insertSchedule,
      id,
      frequencyDays: insertSchedule.frequencyDays || null,
      frequencyMileage: insertSchedule.frequencyMileage || null,
      lastServiceDate: insertSchedule.lastServiceDate || null,
      lastServiceMileage: insertSchedule.lastServiceMileage || null,
      notes: insertSchedule.notes || null,
    };
    this.serviceSchedules.set(id, schedule);
    return schedule;
  }

  async updateServiceSchedule(
    id: number,
    schedule: Partial<InsertServiceSchedule>
  ): Promise<ServiceSchedule | undefined> {
    const existingSchedule = this.serviceSchedules.get(id);
    if (!existingSchedule) return undefined;

    const updatedSchedule = { ...existingSchedule, ...schedule };
    this.serviceSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async deleteServiceSchedule(id: number): Promise<boolean> {
    return this.serviceSchedules.delete(id);
  }

  async getServiceSchedulesNeedingMaintenance(
    vehicleIds?: number[]
  ): Promise<ServiceSchedule[]> {
    const today = new Date();
    let filteredSchedules = Array.from(this.serviceSchedules.values());

    if (vehicleIds && vehicleIds.length > 0) {
      filteredSchedules = filteredSchedules.filter((ss) =>
        vehicleIds.includes(ss.vehicleId)
      );
    }

    return filteredSchedules.filter((schedule) => {
      const vehicleInfo = this.vehicles.get(schedule.vehicleId);
      if (!vehicleInfo) return false; // Need vehicle info

      let needsMaintenance = false;

      // Check date frequency
      if (schedule.frequencyDays && schedule.lastServiceDate) {
        const nextDueDate = calculateNextDate(
          schedule.lastServiceDate,
          schedule.frequencyDays
        );
        if (nextDueDate && nextDueDate <= today) {
          needsMaintenance = true;
        }
      }

      // Check mileage frequency (only if not already flagged by date)
      if (
        !needsMaintenance &&
        schedule.frequencyMileage &&
        schedule.lastServiceMileage !== null &&
        vehicleInfo.mileage !== null
      ) {
        const nextDueMileage = calculateNextMileage(
          schedule.lastServiceMileage,
          schedule.frequencyMileage
        );
        if (nextDueMileage && vehicleInfo.mileage >= nextDueMileage) {
          needsMaintenance = true;
        }
      }

      return needsMaintenance;
    });
  }

  // Maintenance methods
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    return this.maintenanceTasks.get(id);
  }

  async getMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (maintenance) => maintenance.vehicleId === vehicleId
    );
  }

  async getMaintenanceTasks(): Promise<Maintenance[]> {
    return Array.from(this.maintenanceTasks.values());
  }

  async getPendingMaintenance(): Promise<Maintenance[]> {
    const today = new Date();
    return Array.from(this.maintenanceTasks.values()).filter(
      (maintenance) =>
        maintenance.status === "pending" ||
        maintenance.status === "scheduled" ||
        (maintenance.dueDate &&
          new Date(maintenance.dueDate) <= today &&
          (maintenance.status === "pending" ||
            maintenance.status === "scheduled"))
    );
  }

  async getUnscheduledMaintenance(): Promise<Maintenance[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (maintenance) => maintenance.isUnscheduled === true
    );
  }

  async getPendingApprovalMaintenance(): Promise<Maintenance[]> {
    return Array.from(this.maintenanceTasks.values()).filter(
      (maintenance) =>
        maintenance.isUnscheduled === true &&
        maintenance.approvalStatus === "pending"
    );
  }

  async createMaintenance(
    insertMaintenance: InsertMaintenance
  ): Promise<Maintenance> {
    const id = this.maintenanceCounter++;
    const maintenance: Maintenance = {
      ...insertMaintenance,
      id,
      vehiclePartId: insertMaintenance.vehiclePartId || null,
      serviceScheduleId: insertMaintenance.serviceScheduleId || null,
      description: insertMaintenance.description || null,
      dueDate: insertMaintenance.dueDate || null,
      completedDate: null,
      completedMileage: null,
      notes: insertMaintenance.notes || null,
      assignedTo: insertMaintenance.assignedTo || null,
      partsUsed: insertMaintenance.partsUsed || null,
      cost: insertMaintenance.cost || null,
      bill: insertMaintenance.bill || null,
      billImageUrl: insertMaintenance.billImageUrl || null,
      isUnscheduled: insertMaintenance.isUnscheduled || false,
      approvalStatus: insertMaintenance.approvalStatus || null,
      approvedBy: insertMaintenance.approvedBy || null,
    };
    this.maintenanceTasks.set(id, maintenance);
    return maintenance;
  }

  async updateMaintenance(
    id: number,
    maintenance: Partial<InsertMaintenance>
  ): Promise<Maintenance | undefined> {
    const existingMaintenance = this.maintenanceTasks.get(id);
    if (!existingMaintenance) return undefined;

    const updatedMaintenance = { ...existingMaintenance, ...maintenance };

    // If completing, set completedDate and potentially completedMileage
    if (
      updatedMaintenance.status === "completed" &&
      !existingMaintenance.completedDate
    ) {
      updatedMaintenance.completedDate = new Date();
      if (updatedMaintenance.completedMileage === undefined) {
        const vehicle = this.vehicles.get(updatedMaintenance.vehicleId);
        updatedMaintenance.completedMileage = vehicle?.mileage ?? null;
      }
    }

    this.maintenanceTasks.set(id, updatedMaintenance);

    // Update related part/schedule last maintenance info
    if (
      updatedMaintenance.status === "completed" &&
      updatedMaintenance.completedDate
    ) {
      if (updatedMaintenance.vehiclePartId) {
        this.updateVehiclePart(updatedMaintenance.vehiclePartId, {
          lastMaintenanceDate: updatedMaintenance.completedDate,
          lastMaintenanceMileage: updatedMaintenance.completedMileage,
        });
      }
      if (updatedMaintenance.serviceScheduleId) {
        this.updateServiceSchedule(updatedMaintenance.serviceScheduleId, {
          lastServiceDate: updatedMaintenance.completedDate,
          lastServiceMileage: updatedMaintenance.completedMileage,
        });
      }
    }

    return updatedMaintenance;
  }

  async approveMaintenance(
    id: number,
    approverId: number
  ): Promise<Maintenance | undefined> {
    const task = this.maintenanceTasks.get(id);
    if (!task || !task.isUnscheduled) return undefined;
    return this.updateMaintenance(id, {
      approvalStatus: "approved",
      approvedBy: approverId,
      status: "scheduled", // Or 'pending'
    });
  }

  async rejectMaintenance(
    id: number,
    rejectorId: number
  ): Promise<Maintenance | undefined> {
    const task = this.maintenanceTasks.get(id);
    if (!task || !task.isUnscheduled) return undefined;
    return this.updateMaintenance(id, {
      approvalStatus: "rejected",
      approvedBy: rejectorId,
      status: "rejected",
    });
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    return this.maintenanceTasks.delete(id);
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((notification) => notification.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(
        (notification) =>
          notification.userId === userId && notification.isRead === false
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const id = this.notificationCounter++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: insertNotification.isRead ?? false,
      relatedId: insertNotification.relatedId || null,
      relatedType: insertNotification.relatedType || null,
      link: insertNotification.link || null,
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(
    id: number,
    notification: Partial<InsertNotification>
  ): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;

    const updatedNotification = { ...existingNotification, ...notification };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const existingNotification = this.notifications.get(id);
    if (!existingNotification) return undefined;

    const updatedNotification = { ...existingNotification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderCounter++;
    const orderNumber = `PO-${format(new Date(), "yyyy")}-${String(id).padStart(
      4,
      "0"
    )}`;
    const order: Order = {
      ...insertOrder,
      id,
      orderNumber,
      orderedDate: null,
      receivedDate: null,
      supplier: insertOrder.supplier || null,
      totalAmount: insertOrder.totalAmount || null,
      notes: insertOrder.notes || null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(
    id: number,
    order: Partial<InsertOrder>
  ): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder = { ...existingOrder, ...order };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Order Item methods
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }

  async getOrderItemsForOrder(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (orderItem) => orderItem.orderId === orderId
    );
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemCounter++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItem(
    id: number,
    orderItem: Partial<InsertOrderItem>
  ): Promise<OrderItem | undefined> {
    const existingOrderItem = this.orderItems.get(id);
    if (!existingOrderItem) return undefined;

    const updatedOrderItem = { ...existingOrderItem, ...orderItem };
    this.orderItems.set(id, updatedOrderItem);
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  async createActivityLog(
    insertActivityLog: InsertActivityLog
  ): Promise<ActivityLog> {
    const id = this.activityLogCounter++;
    const activityLog: ActivityLog = {
      ...insertActivityLog,
      id,
      relatedId: insertActivityLog.relatedId || null,
      relatedType: insertActivityLog.relatedType || null,
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
}

import { DatabaseStorage } from "./database-storage";

// Export the storage instance
// We're using DatabaseStorage as we now have PostgreSQL configured
export const storage = new DatabaseStorage();
