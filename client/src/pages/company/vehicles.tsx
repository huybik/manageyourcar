/* /client/src/pages/company/vehicles.tsx */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import VehicleList from "@/components/vehicle/vehicle-list"; // Import the list component
import { useTranslation } from "react-i18next";

export default function VehiclesPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("vehicles.title")}
        </h1>
        <p className="text-gray-500">{t("vehicles.description")}</p>
      </div>

      {/* Vehicle List Component */}
      <VehicleList />
    </div>
  );
}
