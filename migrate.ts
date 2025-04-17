// File: /migrate.ts (at the project root)
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

console.log("Starting migration process...");

const dbPath = path.resolve(process.cwd(), "sqlite.db");
const migrationsPath = path.resolve(process.cwd(), "migrations");

console.log(`Database path: ${dbPath}`);
console.log(`Migrations folder: ${migrationsPath}`);

try {
  // Ensure migrations folder exists
  if (!fs.existsSync(migrationsPath)) {
    console.log("Migrations folder does not exist. Skipping migration.");
    process.exit(0); // Exit successfully if no migrations folder
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log("Applying migrations...");
  migrate(db, { migrationsFolder: migrationsPath });

  console.log("Migrations applied successfully.");
  sqlite.close(); // Close the database connection
  process.exit(0); // Exit successfully
} catch (error) {
  console.error("Error running migrations:", error);
  process.exit(1); // Exit with error code
}
