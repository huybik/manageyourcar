/* /server/db.ts */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: ".env" });

// Check for required environment variables
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required.`);
  }
}

// Use postgres-js with individual connection parameters
const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10), // Ensure port is a number
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Add SSL configuration if required by Supabase (usually needed)
  // ssl: 'require', // or { rejectUnauthorized: false } depending on your setup
});

// Pass the postgres-js client to Drizzle
export const db = drizzle(client, { schema });

// Note: The Pool and neonConfig imports/usage are removed as they are specific to Neon Serverless.
