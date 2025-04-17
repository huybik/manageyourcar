/* /client/src/components/inventory/low-stock-alert.tsx */
import { useQuery } from "@tanstack/react-query";
import { Part } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function LowStockAlert() {
  const { t } = useTranslation();
  const { data: lowStockParts, isLoading } = useQuery<Part[]>({
    queryKey: ["/api/parts/low-stock"],
  });

  if (isLoading) {
    return (
      <div className="mb-4 p-3 bg-gray-100 rounded-md animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  if (!lowStockParts || lowStockParts.length === 0) {
    return (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-start">
          <span className="material-icons text-green-500 mr-2">
            check_circle
          </span>
          <div>
            <h4 className="text-green-600 font-medium text-sm">
              {t("inventory.allInStock")}
            </h4>
            <p className="text-gray-700 text-sm mt-1">
              {t("inventory.noItemsBelowThreshold")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md">
      <div className="flex items-start">
        <span className="material-icons text-red-500 mr-2">error_outline</span>
        <div>
          <h4 className="text-red-500 font-medium text-sm">
            {t("dashboard_company.lowStockAlert")}
          </h4>
          <p className="text-gray-700 text-sm mt-1">
            {t("dashboard_company.itemsBelowThreshold", {
              count: lowStockParts.length,
            })}
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="ml-auto text-primary text-sm"
        >
          {t("dashboard_company.orderNow")}
        </Button>
      </div>
    </div>
  );
}
