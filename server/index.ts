// File: /server/index.ts
// --- THIS FILE IS PRIMARILY FOR LOCAL DEVELOPMENT ---
// Vercel uses the files in the /api directory for deployment

import express, { type Request, Response, NextFunction } from "express";
// Removed: import { registerRoutes } from "./routes"; // We don't register routes here for Vercel
import { setupVite, log } from "./vite"; // Keep Vite for local dev HMR
// Removed: import { seedDatabase } from "./db-seed"; // Seeding/Migration happens in Vercel build
// Removed: import { db } from "./db";
// Removed: import { migrate } from "drizzle-orm/better-sqlite3/migrator";
// Removed: import fs from "fs";
// Removed: import path from "path";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Local Development Logging Middleware ---
app.use((req, res, next) => {
  // ... (keep existing logging middleware if desired for local dev)
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// --- Local Development API Simulation (Optional but helpful) ---
// You *could* re-implement your routes here using app.get, app.post, etc.
// OR use a tool like `vercel dev` which simulates the Vercel environment locally.
// For simplicity, we'll rely on `vercel dev` or running API functions manually.
log(
  "Local server started. API routes are handled by Vercel (run `vercel dev`)."
);

// --- Local Development Error Handler ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  log(`Error: ${status} - ${message}`);
  console.error(err.stack); // Log stack trace locally
  res.status(status).json({ message });
});

(async () => {
  const server = createServer(app);

  // Setup Vite for HMR in development ONLY
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // In a real local setup without Vercel, you might serve static files here
    // But for Vercel deployment focus, this part is less relevant.
    log(
      "Running in non-development mode. Static serving handled by Vercel in production."
    );
    // Add basic fallback for local testing if needed
    app.get("*", (req, res) => {
      res.status(404).send("Not Found (Static serving handled by Vite/Vercel)");
    });
  }

  const port = process.env.PORT || 5173; // Use a different port for local dev if needed
  server.listen(port, () => {
    log(`Local development server listening on http://localhost:${port}`);
    log("Run `vercel dev` to simulate Vercel environment with API routes.");
  });
})();
