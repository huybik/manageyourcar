// File: /server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./db-seed";
import { db } from "./db"; // Import db to potentially run migrations
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run migrations
  try {
    const migrationsPath = path.resolve(process.cwd(), "migrations");
    log(`Attempting to run migrations from: ${migrationsPath}`);

    // Check if the folder exists and has SQL files
    const migrationFilesExist =
      fs.existsSync(migrationsPath) &&
      fs.readdirSync(migrationsPath).some((file) => file.endsWith(".sql"));

    if (!migrationFilesExist) {
      log(`Migrations folder '${migrationsPath}' is empty or does not exist.`);
      log(
        "Please run 'npx drizzle-kit generate' to create migration files based on your schema."
      );
    } else {
      // Apply migrations
      migrate(db, { migrationsFolder: migrationsPath });
      log("Migrations applied successfully.");
    }
  } catch (error) {
    console.error(`Error running migrations: ${error}`);
    log(`Error running migrations: ${error}`);
    // It's often better to exit if migrations fail during startup
    process.exit(1);
  }

  // Seed the database with initial data
  try {
    await seedDatabase();
  } catch (error) {
    // Add a check for the specific "no such table" error after migration attempt
    if (error instanceof Error && error.message.includes("no such table")) {
      log("Database seeding failed because tables are missing.");
      log(
        "This likely means migrations did not run correctly or were not generated."
      );
      log(
        "Ensure you have run 'npx drizzle-kit generate' and that migrations apply without errors."
      );
    } else {
      console.error(`Error seeding database: ${error}`);
      log(`Error seeding database: ${error}`);
    }
    // Decide if you want to exit here or continue potentially without seeded data
    // process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    // It's often better to log the full error on the server
    console.error("Unhandled error:", err);
    // Avoid throwing the error again here unless you have a top-level process error handler
    // throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      // reusePort: true, // Removed this line to fix ENOTSUP error
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
