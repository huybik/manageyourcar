import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import InventoryList from "@/components/inventory/inventory-list";

export default function InventoryPage() {
  const { toast } = useToast();
  
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        <p className="text-gray-500">Track and manage your parts inventory</p>
      </div>
      
      {/* Content */}
      <InventoryList />
    </div>
  );
}
