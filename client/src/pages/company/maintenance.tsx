/* /client/src/pages/company/maintenance.tsx */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Maintenance, Vehicle, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MaintenanceList from "@/components/maintenance/maintenance-list";
import MaintenanceForm from "@/components/maintenance/maintenance-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export default function MaintenancePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: maintenanceTasks, isLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const handleCreateMaintenance = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = (success?: boolean) => {
    setIsFormOpen(false);
    // Toast is handled inside the form now
    // if (success) {
    //   toast({
    //     title: "Maintenance task created",
    //     description: "The maintenance task has been created successfully.",
    //   });
    // }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("maintenance.title")}
          </h1>
          <p className="text-gray-500">{t("maintenance.description")}</p>
        </div>
        <Button onClick={handleCreateMaintenance}>
          <span className="material-icons text-sm mr-1">add</span>
          {t("maintenance.scheduleMaintenance")}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          className="w-full md:w-80"
          placeholder={t("maintenance.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t("maintenance.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("maintenance.allTasks")}</SelectItem>
            <SelectItem value="pending">{t("maintenance.pending")}</SelectItem>
            <SelectItem value="scheduled">
              {t("maintenance.scheduled")}
            </SelectItem>
            <SelectItem value="completed">
              {t("maintenance.completed")}
            </SelectItem>
            <SelectItem value="overdue">{t("maintenance.overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance Tasks List */}
      <MaintenanceList
        title={t("maintenance.maintenanceTasks")}
        viewAll={false}
        filter={statusFilter !== "all" ? statusFilter : undefined}
        showActions={true}
      />

      {/* Create Maintenance Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("maintenance.formTitle")}</DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            vehicles={vehicles || []}
            users={users?.filter((user) => user.role === "driver") || []}
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => handleFormClose(true)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
