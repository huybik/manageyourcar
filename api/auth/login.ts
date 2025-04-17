// File: /api/auth/login.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage"; // Adjust path as needed

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);

    // IMPORTANT: Replace with proper password hashing and comparison in production!
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // For simplicity, we're returning the user without the password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (err: any) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
