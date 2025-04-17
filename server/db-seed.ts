import { db } from "./db";
import {
  users,
  vehicles,
  parts,
  vehicleParts,
  maintenance,
  notifications,
  activityLogs,
} from "@shared/schema";

// Function to seed initial data
export async function seedDatabase() {
  console.log("Checking if database needs seeding...");

  // Check if users table is empty
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seed");
    return;
  }

  console.log("Seeding database with initial data...");

  // Create admin user
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      password: "password", // In production, this should be hashed
      name: "Admin User",
      role: "company_admin",
      email: "admin@example.com",
      phone: "555-123-4567",
      notificationEnabled: true,
    })
    .returning();

  // Create driver user
  const [driver1] = await db
    .insert(users)
    .values({
      username: "mjohnson",
      password: "password", // In production, this should be hashed
      name: "Mike Johnson",
      role: "driver",
      email: "mike@example.com",
      phone: "555-987-6543",
      notificationEnabled: true,
    })
    .returning();

  const [driver2] = await db
    .insert(users)
    .values({
      username: "sarah",
      password: "password",
      name: "Sarah Williams",
      role: "driver",
      email: "sarah@example.com",
      phone: "555-456-7890",
      notificationEnabled: true,
    })
    .returning();

  const [driver3] = await db
    .insert(users)
    .values({
      username: "robert",
      password: "password",
      name: "Robert Chen",
      role: "driver",
      email: "robert@example.com",
      phone: "555-222-3333",
      notificationEnabled: true,
    })
    .returning();

  // Create vehicles
  const [truck] = await db
    .insert(vehicles)
    .values({
      name: "Delivery Truck 1",
      type: "truck",
      vin: "1HGCM82633A123456",
      licensePlate: "XYZ-1234",
      make: "Ford",
      model: "F-150",
      year: 2022,
      mileage: 15000,
      assignedTo: driver1.id,
      status: "active",
      nextMaintenanceDate: new Date(
        new Date().setDate(new Date().getDate() + 30)
      ),
      nextMaintenanceMileage: 20000,
      qrCode: "TRUCK-1-QR",
    })
    .returning();

  const [sedan] = await db
    .insert(vehicles)
    .values({
      name: "Company Sedan",
      type: "sedan",
      vin: "JH4KA7650MC001234",
      licensePlate: "ABC-5678",
      make: "Honda",
      model: "Civic",
      year: 2021,
      mileage: 25000,
      assignedTo: driver2.id,
      status: "active",
      nextMaintenanceDate: new Date(
        new Date().setDate(new Date().getDate() + 15)
      ),
      nextMaintenanceMileage: 30000,
      qrCode: "SEDAN-1-QR",
    })
    .returning();

  const [van] = await db
    .insert(vehicles)
    .values({
      name: "Cargo Van",
      type: "van",
      vin: "1FTNS24W94HA12345",
      licensePlate: "DEF-9012",
      make: "Mercedes-Benz",
      model: "Sprinter",
      year: 2023,
      mileage: 5000,
      assignedTo: driver3.id,
      status: "active",
      nextMaintenanceDate: new Date(
        new Date().setDate(new Date().getDate() + 45)
      ),
      nextMaintenanceMileage: 10000,
      qrCode: "VAN-1-QR",
    })
    .returning();

  // Create parts
  const [oilFilters] = await db
    .insert(parts)
    .values({
      name: "Oil Filter",
      sku: "OF-123456",
      description: "Standard oil filter for trucks and vans",
      category: "Filters",
      isStandard: true,
      price: 15.99,
      supplier: "AutoParts Inc.",
      location: "Warehouse A, Shelf 3",
      maintenanceInterval: 5000, // Miles
    })
    .returning();

  const [brakePads] = await db
    .insert(parts)
    .values({
      name: "Brake Pads - Heavy Duty",
      sku: "BP-789012",
      description: "Heavy duty brake pads for commercial vehicles",
      category: "Brakes",
      isStandard: true,
      price: 89.99,
      supplier: "Brakemaster Systems",
      location: "Warehouse B, Shelf 1",
      maintenanceInterval: 20000, // Miles
    })
    .returning();

  const [wiperBlades] = await db
    .insert(parts)
    .values({
      name: "Wiper Blades - All Weather",
      sku: "WB-345678",
      description: "All-weather wiper blades",
      category: "Exterior",
      isStandard: true,
      price: 24.99,
      supplier: "AutoParts Inc.",
      location: "Warehouse A, Shelf 5",
      maintenanceInterval: 10000, // Miles
    })
    .returning();

  const [airFilters] = await db
    .insert(parts)
    .values({
      name: "Air Filter - Premium",
      sku: "AF-901234",
      description: "Premium cabin air filter",
      category: "Filters",
      isStandard: true,
      price: 29.99,
      supplier: "FilterPro",
      location: "Warehouse A, Shelf 4",
      maintenanceInterval: 15000, // Miles
    })
    .returning();

  // Associate parts with vehicles
  await db.insert(vehicleParts).values({
    vehicleId: truck.id,
    partId: oilFilters.id,
    isCustom: false,
    maintenanceInterval: 5000,
    lastMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() - 60)
    ),
    lastMaintenanceMileage: 10000,
    nextMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() + 30)
    ),
    nextMaintenanceMileage: 15000,
  });

  await db.insert(vehicleParts).values({
    vehicleId: truck.id,
    partId: brakePads.id,
    isCustom: false,
    maintenanceInterval: 20000,
    lastMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() - 120)
    ),
    lastMaintenanceMileage: 5000,
    nextMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() + 60)
    ),
    nextMaintenanceMileage: 25000,
  });

  await db.insert(vehicleParts).values({
    vehicleId: sedan.id,
    partId: wiperBlades.id,
    isCustom: false,
    maintenanceInterval: 10000,
    lastMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() - 45)
    ),
    lastMaintenanceMileage: 20000,
    nextMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() + 15)
    ),
    nextMaintenanceMileage: 30000,
  });

  await db.insert(vehicleParts).values({
    vehicleId: van.id,
    partId: airFilters.id,
    isCustom: false,
    maintenanceInterval: 15000,
    lastMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() - 30)
    ),
    lastMaintenanceMileage: 2000,
    nextMaintenanceDate: new Date(
      new Date().setDate(new Date().getDate() + 90)
    ),
    nextMaintenanceMileage: 17000,
  });

  // Create maintenance tasks
  const [oilChange] = await db
    .insert(maintenance)
    .values({
      vehicleId: truck.id,
      type: "oil_change",
      description: "Regular oil change and filter replacement",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      status: "pending",
      priority: "normal",
      assignedTo: driver1.id,
      notes: "Use synthetic oil for this vehicle",
    })
    .returning();

  const [brakeInspection] = await db
    .insert(maintenance)
    .values({
      vehicleId: sedan.id,
      type: "brake_inspection",
      description: "Routine brake system inspection",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      status: "scheduled",
      priority: "high",
      assignedTo: driver2.id,
      notes: "Customer reported unusual noise when braking",
    })
    .returning();

  const [tireRotation] = await db
    .insert(maintenance)
    .values({
      vehicleId: van.id,
      type: "tire_rotation",
      description: "Rotate tires and check pressure",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
      status: "overdue",
      priority: "normal",
      assignedTo: driver3.id,
      notes: "Also check for unusual wear patterns",
    })
    .returning();

  // Create notifications
  await db.insert(notifications).values({
    userId: driver1.id,
    title: "Maintenance Due",
    message: "Oil change due in 7 days for Delivery Truck 1",
    type: "maintenance",
    isRead: false,
    createdAt: new Date(),
    relatedId: oilChange.id,
    relatedType: "maintenance",
    link: `/driver/maintenance/${oilChange.id}`,
  });

  await db.insert(notifications).values({
    userId: driver2.id,
    title: "Urgent Maintenance",
    message: "High priority brake inspection scheduled in 3 days",
    type: "maintenance",
    isRead: false,
    createdAt: new Date(),
    relatedId: brakeInspection.id,
    relatedType: "maintenance",
    link: `/driver/maintenance/${brakeInspection.id}`,
  });

  await db.insert(notifications).values({
    userId: driver3.id,
    title: "Overdue Maintenance",
    message: "Tire rotation is now overdue by 2 days",
    type: "maintenance",
    isRead: false,
    createdAt: new Date(),
    relatedId: tireRotation.id,
    relatedType: "maintenance",
    link: `/driver/maintenance/${tireRotation.id}`,
  });

  // Create activity logs
  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "user_created",
    description: "Created new driver account for Mike Johnson",
    timestamp: new Date(new Date().setDate(new Date().getDate() - 30)),
    relatedId: driver1.id,
    relatedType: "user",
  });

  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "vehicle_assigned",
    description: "Assigned Delivery Truck 1 to Mike Johnson",
    timestamp: new Date(new Date().setDate(new Date().getDate() - 25)),
    relatedId: truck.id,
    relatedType: "vehicle",
  });

  await db.insert(activityLogs).values({
    userId: driver1.id,
    action: "maintenance_reported",
    description: "Reported oil leak in Delivery Truck 1",
    timestamp: new Date(new Date().setDate(new Date().getDate() - 10)),
    relatedId: truck.id,
    relatedType: "vehicle",
  });

  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "maintenance_scheduled",
    description: "Scheduled maintenance for oil change on Delivery Truck 1",
    timestamp: new Date(new Date().setDate(new Date().getDate() - 5)),
    relatedId: oilChange.id,
    relatedType: "maintenance",
  });

  console.log("Database seeded successfully");
}
