/* /server/db-seed.ts */
import { db } from "./db";
import {
  users,
  vehicles,
  parts,
  vehicleParts,
  maintenance,
  notifications,
  activityLogs,
  serviceSchedules, // Added
} from "@shared/schema";
import { addDays } from "date-fns"; // Import addDays

// Function to seed initial data
export async function seedDatabase() {
  console.log("Checking if database needs seeding...");

  // // Check if users table is empty
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has users, skipping seed");
    return;
  }

  console.log("Seeding database with initial data...");

  // --- Create Users ---
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

  // --- Create Vehicles ---
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
      // Removed nextMaintenanceDate/Mileage
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
      // Removed nextMaintenanceDate/Mileage
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
      // Removed nextMaintenanceDate/Mileage
      qrCode: "VAN-1-QR",
    })
    .returning();

  // --- Create Parts ---
  const [oilFilters] = await db
    .insert(parts)
    .values({
      name: "Oil Filter",
      sku: "OF-123456",
      description: "Standard oil filter for trucks and vans",
      category: "Filters",
      isStandard: true,
      price: 15.99,
      quantity: 15, // Added quantity
      minimumStock: 5, // Added minimum stock
      supplier: "AutoParts Inc.",
      location: "Warehouse A, Shelf 3",
      maintenanceIntervalMileage: 5000, // Renamed from maintenanceInterval
      maintenanceIntervalDays: 180, // Added days interval (6 months)
      icon: "filter_alt", // Added icon
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
      quantity: 8, // Added quantity
      minimumStock: 10, // Added minimum stock
      supplier: "Brakemaster Systems",
      location: "Warehouse B, Shelf 1",
      maintenanceIntervalMileage: 20000, // Renamed from maintenanceInterval
      // No day interval specified for this part
      icon: "disc_full", // Added icon
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
      quantity: 25, // Added quantity
      minimumStock: 15, // Added minimum stock
      supplier: "AutoParts Inc.",
      location: "Warehouse A, Shelf 5",
      maintenanceIntervalDays: 365, // Added days interval (1 year)
      // No mileage interval specified
      icon: "cleaning_services", // Added icon
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
      quantity: 12, // Added quantity
      minimumStock: 8, // Added minimum stock
      supplier: "FilterPro",
      location: "Warehouse A, Shelf 4",
      maintenanceIntervalMileage: 15000, // Renamed from maintenanceInterval
      icon: "air", // Added icon
    })
    .returning();

  // --- Associate Parts with Vehicles ---
  const installDateTruckOil = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
  const installMileageTruckOil = 10000;
  const [vpTruckOil] = await db
    .insert(vehicleParts)
    .values({
      vehicleId: truck.id,
      partId: oilFilters.id,
      installationDate: installDateTruckOil,
      installationMileage: installMileageTruckOil,
      lastMaintenanceDate: installDateTruckOil, // Assume last maint = install
      lastMaintenanceMileage: installMileageTruckOil,
      // Removed maintenanceInterval, nextMaintenanceDate, nextMaintenanceMileage
    })
    .returning();

  const installDateTruckBrakes = new Date(
    Date.now() - 120 * 24 * 60 * 60 * 1000
  ); // 120 days ago
  const installMileageTruckBrakes = 5000;
  const [vpTruckBrakes] = await db
    .insert(vehicleParts)
    .values({
      vehicleId: truck.id,
      partId: brakePads.id,
      installationDate: installDateTruckBrakes,
      installationMileage: installMileageTruckBrakes,
      // No last maintenance yet
    })
    .returning();

  const installDateSedanWipers = new Date(
    Date.now() - 45 * 24 * 60 * 60 * 1000
  ); // 45 days ago
  const installMileageSedanWipers = 20000;
  const [vpSedanWipers] = await db
    .insert(vehicleParts)
    .values({
      vehicleId: sedan.id,
      partId: wiperBlades.id,
      installationDate: installDateSedanWipers,
      installationMileage: installMileageSedanWipers,
    })
    .returning();

  const installDateVanAir = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const installMileageVanAir = 2000;
  const [vpVanAir] = await db
    .insert(vehicleParts)
    .values({
      vehicleId: van.id,
      partId: airFilters.id,
      installationDate: installDateVanAir,
      installationMileage: installMileageVanAir,
    })
    .returning();

  // --- Create Service Schedules ---
  const [scheduleTruck6m] = await db
    .insert(serviceSchedules)
    .values({
      vehicleId: truck.id,
      description: "6-Month General Checkup",
      frequencyDays: 180,
      lastServiceDate: installDateTruckOil, // Use a recent date
      lastServiceMileage: installMileageTruckOil,
    })
    .returning();

  const [scheduleSedanAnnual] = await db
    .insert(serviceSchedules)
    .values({
      vehicleId: sedan.id,
      description: "Annual Inspection",
      frequencyDays: 365,
      lastServiceDate: installDateSedanWipers, // Use a recent date
      lastServiceMileage: installMileageSedanWipers,
    })
    .returning();

  const [scheduleVan10k] = await db
    .insert(serviceSchedules)
    .values({
      vehicleId: van.id,
      description: "10,000 Mile Service",
      frequencyMileage: 10000,
      lastServiceDate: installDateVanAir, // Use a recent date
      lastServiceMileage: installMileageVanAir,
    })
    .returning();

  // --- Create Maintenance Tasks ---
  // Example: Scheduled maintenance based on a part's lifecycle
  const [oilChange] = await db
    .insert(maintenance)
    .values({
      vehicleId: truck.id,
      vehiclePartId: vpTruckOil.id, // Link to the specific vehicle part
      type: "part_maintenance", // Updated type
      description: "Regular oil change and filter replacement",
      dueDate: addDays(new Date(), 7), // Due in 7 days
      status: "pending", // Updated status
      priority: "normal",
      assignedTo: driver1.id,
      notes: "Use synthetic oil for this vehicle",
      isUnscheduled: false, // Explicitly set
    })
    .returning();

  // Example: Scheduled maintenance based on a general schedule
  const [annualInspection] = await db
    .insert(maintenance)
    .values({
      vehicleId: sedan.id,
      serviceScheduleId: scheduleSedanAnnual.id, // Link to the service schedule
      type: "general_service", // Updated type
      description: "Annual Vehicle Inspection",
      dueDate: addDays(new Date(), 15), // Due in 15 days
      status: "scheduled", // Updated status
      priority: "high",
      assignedTo: driver2.id,
      notes: "Check brakes thoroughly as per schedule.",
      isUnscheduled: false,
    })
    .returning();

  // Example: Overdue maintenance (can be linked or unlinked)
  const [tireRotation] = await db
    .insert(maintenance)
    .values({
      vehicleId: van.id,
      // serviceScheduleId: scheduleVan10k.id, // Optionally link
      type: "general_service", // Updated type
      description: "Rotate tires and check pressure",
      dueDate: addDays(new Date(), -2), // Overdue by 2 days
      status: "pending", // Status is pending even if overdue
      priority: "normal",
      assignedTo: driver3.id,
      notes: "Also check for unusual wear patterns",
      isUnscheduled: false,
    })
    .returning();

  // Example: Unscheduled maintenance reported by driver
  const [unscheduledRepair] = await db
    .insert(maintenance)
    .values({
      vehicleId: truck.id,
      type: "unscheduled_repair", // New type
      description: "Check Engine Light On",
      // dueDate: null, // No specific due date initially
      status: "pending", // Pending approval
      priority: "high",
      assignedTo: driver1.id, // Reported by driver
      notes: "Light came on during route. Engine seems hesitant.",
      isUnscheduled: true, // Mark as unscheduled
      approvalStatus: "pending", // Needs approval
    })
    .returning();

  // --- Create Notifications ---
  await db.insert(notifications).values({
    userId: driver1.id,
    title: "Maintenance Due",
    message: `Oil change due soon for ${truck.name}`,
    type: "maintenance_due", // Updated type
    isRead: false,
    createdAt: new Date(),
    relatedId: oilChange.id,
    relatedType: "maintenance",
    link: `/maintenance`, // Updated link
  });

  await db.insert(notifications).values({
    userId: driver2.id,
    title: "Maintenance Scheduled",
    message: `High priority Annual Inspection scheduled for ${sedan.name}`,
    type: "maintenance_scheduled", // Updated type
    isRead: false,
    createdAt: new Date(),
    relatedId: annualInspection.id,
    relatedType: "maintenance",
    link: `/maintenance`, // Updated link
  });

  await db.insert(notifications).values({
    userId: driver3.id,
    title: "Overdue Maintenance",
    message: `Tire rotation is overdue for ${van.name}`,
    type: "maintenance_overdue", // Updated type
    isRead: false,
    createdAt: new Date(),
    relatedId: tireRotation.id,
    relatedType: "maintenance",
    link: `/maintenance`, // Updated link
  });

  // Notification for admin about unscheduled task
  await db.insert(notifications).values({
    userId: adminUser.id,
    title: "Maintenance Approval Required",
    message: `${driver1.name} reported an issue with ${truck.name} (Check Engine Light)`,
    type: "maintenance_approval_request", // New type
    isRead: false,
    createdAt: new Date(),
    relatedId: unscheduledRepair.id,
    relatedType: "maintenance",
    link: `/maintenance`, // Link to company maintenance page
  });

  // --- Create Activity Logs ---
  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "user_created",
    description: `Created new driver account for ${driver1.name}`,
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    relatedId: driver1.id,
    relatedType: "user",
  });

  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "vehicle_assigned",
    description: `Assigned ${truck.name} to ${driver1.name}`,
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    relatedId: truck.id,
    relatedType: "vehicle",
  });

  await db.insert(activityLogs).values({
    userId: driver1.id,
    action: "maintenance_reported", // Changed action name slightly
    description: `${driver1.name} reported issue: Check Engine Light On for ${truck.name}`,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    relatedId: unscheduledRepair.id, // Link to the maintenance task
    relatedType: "maintenance",
  });

  await db.insert(activityLogs).values({
    userId: adminUser.id,
    action: "maintenance_scheduled",
    description: `Scheduled maintenance: Oil Change & Filter for ${truck.name}`,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    relatedId: oilChange.id,
    relatedType: "maintenance",
  });

  console.log("Database seeded successfully");
}
