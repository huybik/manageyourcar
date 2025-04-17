// File: /api/users/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";
import { insertUserSchema } from "../../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      const users = await storage.getUsers();
      // Remove passwords before sending response
      const sanitizedUsers = users.map(({ password, ...rest }) => rest);
      return res.status(200).json(sanitizedUsers);
    } else if (req.method === "POST") {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // IMPORTANT: Hash password before storing in production!
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err: any) {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error("User API error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
