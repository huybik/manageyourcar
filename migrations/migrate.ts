// migrate.ts (example)
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" }); // Adjust path if needed

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
  }

  console.log("Connecting to database...");
  // Use connection for migrations, notice the max: 1
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });

  console.log("Migrations applied successfully!");
  await migrationClient.end();
  console.log("Database connection closed.");
};

runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
