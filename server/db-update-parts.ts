// Update parts with quantity values - one-time utility function

import { db } from "./db";
import { parts } from "@shared/schema";
import { eq } from "drizzle-orm";
import { fileURLToPath } from 'url';

export async function updatePartsQuantity() {
  // Update part quantities for testing purposes
  
  // Sample values
  const updates = [
    { id: 4, quantity: 25, minimumStock: 5 },  // Plenty in stock
    { id: 5, quantity: 15, minimumStock: 15 }, // Just at threshold
    { id: 6, quantity: 8, minimumStock: 20 },  // Low stock
    { id: 7, quantity: 3, minimumStock: 10 },  // Very low stock
    { id: 8, quantity: 0, minimumStock: 5 },   // Out of stock
  ];
  
  for (const update of updates) {
    await db.update(parts)
      .set({ 
        quantity: update.quantity, 
        minimumStock: update.minimumStock 
      })
      .where(eq(parts.id, update.id));
  }
  
  console.log("Updated parts quantities");
}

// Immediately invoke the function
updatePartsQuantity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error updating parts quantities:", err);
    process.exit(1);
  });