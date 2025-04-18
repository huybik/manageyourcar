/* /client/src/components/inventory/inventory-list.tsx */
import { useQuery } from "@tanstack/react-query";
import { Part } from "@shared/schema";
import LowStockAlert from "./low-stock-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface InventoryListProps {
  onEditPart: (part: Part) => void;
  onAddPart: () => void; // Add prop for handling add action
}

export default function InventoryList({
  onEditPart,
  onAddPart,
}: InventoryListProps) {
  const { t } = useTranslation();
  const { data: parts, isLoading } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Filter parts based on search term
  const filteredParts = parts?.filter(
    (part) =>
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate percentage for progress bar
  const calculateStockPercentage = (current: number, minimum: number) => {
    // We'll show a percentage relative to the minimum stock (2x minimum = 100%)
    if (minimum <= 0) return 100; // Avoid division by zero and handle cases with no minimum
    const percentage = (current / (minimum * 2)) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const getStockClass = (quantity: number, minimumStock: number) => {
    if (minimumStock <= 0) return "bg-green-500"; // No minimum, always good
    if (quantity <= minimumStock * 0.25) return "bg-red-500"; // Critical (< 25% of minimum)
    if (quantity <= minimumStock * 0.5) return "bg-red-400"; // Very Low (< 50% of minimum)
    if (quantity < minimumStock) return "bg-amber-500"; // Low (< 100% of minimum)
    if (quantity < minimumStock * 1.5) return "bg-green-400"; // Adequate (< 150% of minimum)
    return "bg-green-500"; // Good (> 150% of minimum)
  };

  const formatInterval = (days?: number | null, mileage?: number | null) => {
    if (days && mileage) return `${days}d / ${mileage?.toLocaleString()} mi`;
    if (days) return `${days}d`;
    if (mileage) return `${mileage?.toLocaleString()} mi`;
    return t("inventory.notSet");
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <Input
          className="w-full md:w-80"
          placeholder={t("inventory.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />
        {/* Removed Add button here, handled by parent page */}
        {/* <Button className="w-full md:w-auto" onClick={onAddPart}>
          <span className="material-icons text-sm mr-1">add</span>
          {t("inventory.addNewPart")}
        </Button> */}
      </div>

      <LowStockAlert />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">{t("inventory.partDetails")}</th>
                <th className="px-6 py-3">{t("inventory.category")}</th>
                <th className="px-6 py-3">{t("inventory.location")}</th>
                <th className="px-6 py-3">{t("inventory.price")}</th>
                <th className="px-6 py-3">{t("inventory.stockLevel")}</th>
                <th className="px-6 py-3">{t("inventory.maintInterval")}</th>
                <th className="px-6 py-3">{t("inventory.actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2 mt-2"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
              ) : filteredParts && filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {part.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t("inventory.skuPrefix")} {part.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {part.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {part.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ${part.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`rounded-full h-2 ${getStockClass(
                              part.quantity ?? 0,
                              part.minimumStock ?? 0
                            )}`}
                            style={{
                              width: `${calculateStockPercentage(
                                part.quantity ?? 0,
                                part.minimumStock ?? 0
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            (part.quantity ?? 0) < (part.minimumStock ?? 0)
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {part.quantity ?? 0}/{part.minimumStock ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatInterval(
                        part.maintenanceIntervalDays,
                        part.maintenanceIntervalMileage
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        className="text-primary font-medium"
                        onClick={() => onEditPart(part)} // Call onEditPart prop
                      >
                        {t("inventory.edit")}
                      </button>
                      <button className="text-gray-400">
                        {t("inventory.delete")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7} // Increased colspan
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {searchTerm
                      ? t("inventory.noPartsMatch")
                      : t("inventory.noPartsAvailable")}
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
