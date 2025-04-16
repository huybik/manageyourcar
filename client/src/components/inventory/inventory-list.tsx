import { useQuery } from "@tanstack/react-query";
import { Part } from "@shared/schema";
import LowStockAlert from "./low-stock-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function InventoryList() {
  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter parts based on search term
  const filteredParts = parts?.filter(part => 
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate percentage for progress bar
  const calculateStockPercentage = (current: number, minimum: number) => {
    // We'll show a percentage relative to the minimum stock (2x minimum = 100%)
    const percentage = (current / (minimum * 2)) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const getStockClass = (quantity: number, minimumStock: number) => {
    if (quantity <= minimumStock * 0.25) return "bg-red-500"; // Critical (< 25% of minimum)
    if (quantity <= minimumStock * 0.5) return "bg-red-400"; // Very Low (< 50% of minimum)
    if (quantity < minimumStock) return "bg-amber-500"; // Low (< 100% of minimum)
    if (quantity < minimumStock * 1.5) return "bg-green-400"; // Adequate (< 150% of minimum)
    return "bg-green-500"; // Good (> 150% of minimum)
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <Input
          className="w-full md:w-80"
          placeholder="Search by name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />
        <Button className="w-full md:w-auto">
          <span className="material-icons text-sm mr-1">add</span>
          Add New Part
        </Button>
      </div>

      <LowStockAlert />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Part Details</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/2 mt-2"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredParts && filteredParts.length > 0 ? (
                filteredParts.map(part => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{part.name}</div>
                        <div className="text-xs text-gray-500">SKU: {part.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{part.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{part.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">${part.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`rounded-full h-2 ${getStockClass(part.quantity, part.minimumStock)}`} 
                            style={{ width: `${calculateStockPercentage(part.quantity, part.minimumStock)}%` }}
                          ></div>
                        </div>
                        <span 
                          className={`text-sm font-medium ${
                            part.quantity < part.minimumStock 
                              ? 'text-red-500' 
                              : 'text-green-600'
                          }`}
                        >
                          {part.quantity}/{part.minimumStock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button className="text-primary font-medium">Edit</button>
                      <button className="text-gray-400">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No parts matching your search criteria' : 'No parts available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
