// File: /api/users/[id].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storage } from "../../server/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id: idString } = req.query;
  const id = parseInt(idString as string);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    if (req.method === "GET") {
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    }
    // Add PUT/DELETE logic here if needed, similar to other [id].ts files
    else {
      res.setHeader("Allow", ["GET"]); // Add PUT/DELETE if implemented
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err: any) {
    console.error(`User API error for ID ${id}:`, err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}
