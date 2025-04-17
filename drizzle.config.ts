/* /drizzle.config.ts */
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs"; // Import the 'fs' module
import path from "path"; // Optional: for robust path handling

// Load environment variables from .env file
dotenv.config({ path: ".env" });

// Ensure PGSSLROOTCERT is set in your .env file or environment
const sslConfig = process.env.PGSSLROOTCERT
  ? {
      // Read the CA certificate file content
      ca: fs.readFileSync(path.resolve(process.env.PGSSLROOTCERT)).toString(),
      // Ensure verification is enabled (this is usually the default)
      // rejectUnauthorized: true, // You typically don't need to set this explicitly unless overriding a default 'false'
    }
  : undefined; // Or set to 'require' or other basic SSL mode if no custom CA is needed but SSL is mandatory

// --- Option B: Hardcode the path (less flexible) ---
// const sslConfig = {
//   ca: fs.readFileSync(path.resolve('./prod-ca-2021.crt')).toString(),
// };

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

export default defineConfig({
  out: "./migrations", // Directory to store migration files
  schema: "./shared/schema.ts", // Path to your schema file
  dialect: "postgresql", // Specify the dialect as postgresql
  dbCredentials: {
    // Use individual connection parameters from environment variables
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: false, // Use the sslConfig object defined above
    // Add SSL configuration if required by Supabase
    // ssl: true, // or 'require' or object like { rejectUnauthorized: false }
  },
  // Optional: Enable verbose logging for Drizzle Kit
  verbose: true,
  // Optional: Fail migration generation if SQL contains non-strict statements
  strict: false,
});

// --- Option A: Read the certificate path from environment variable ---
