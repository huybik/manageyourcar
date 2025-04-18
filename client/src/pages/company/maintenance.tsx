/* /client/src/pages/company/maintenance.tsx */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

export default function MaintenancePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTaskForApproval, setSelectedTaskForApproval] =
    useState<Maintenance | null>(null);

  const { data: maintenanceTasks, isLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch pending approval tasks separately
  const { data: pendingApprovalTasks } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance/pending-approval"],
  });

  const handleCreateMaintenance = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = (success?: boolean) => {
    setIsFormOpen(false);
  };

  const approveMutation = useMutation({
    mutationFn: async ({
      taskId,
      userId,
    }: {
      taskId: number;
      userId: number;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/maintenance/${taskId}/approval`,
        { approved: true, userId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/maintenance/pending-approval"],
      });
      toast({
        title: t("maintenance.approvedTitle"),
        description: t("maintenance.approvedDesc"),
      });
      setSelectedTaskForApproval(null);
    },
    onError: (error) => {
      toast({
        title: t("maintenance.approvalFailedTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("maintenance.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      taskId,
      userId,
    }: {
      taskId: number;
      userId: number;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/maintenance/${taskId}/approval`,
        { approved: false, userId }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/maintenance/pending-approval"],
      });
      toast({
        title: t("maintenance.rejectedTitle"),
        description: t("maintenance.rejectedDesc"),
      });
      setSelectedTaskForApproval(null);
    },
    onError: (error) => {
      toast({
        title: t("maintenance.rejectionFailedTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("maintenance.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const handleApprove = (task: Maintenance) => {
    // Assuming you have access to the current admin user's ID
    const adminUserId = users?.find((u) => u.role === "company_admin")?.id; // Replace with actual admin user ID logic
    if (!adminUserId) {
      toast({
        title: "Error",
        description: "Could not identify administrator.",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate({ taskId: task.id, userId: adminUserId });
  };

  const handleReject = (task: Maintenance) => {
    const adminUserId = users?.find((u) => u.role === "company_admin")?.id; // Replace with actual admin user ID logic
    if (!adminUserId) {
      toast({
        title: "Error",
        description: "Could not identify administrator.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ taskId: task.id, userId: adminUserId });
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

      {/* Pending Approvals Section */}
      {pendingApprovalTasks && pendingApprovalTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {t("maintenance.pendingApprovals")}
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            {pendingApprovalTasks.map((task) => {
              const vehicle = vehicles?.find((v) => v.id === task.vehicleId);
              const driver = users?.find((u) => u.id === task.assignedTo);
              return (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white rounded shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      {task.description || t("maintenance.unscheduledReport")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("maintenance.vehicle")}:{" "}
                      {vehicle?.name || `ID ${task.vehicleId}`} |{" "}
                      {t("maintenance.reportedBy")}:{" "}
                      {driver?.name || t("maintenance.unknown")}
                    </p>
                    {task.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {t("maintenance.notesLabel")}: {task.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-50 hover:bg-red-100 text-red-600 border-red-300"
                        >
                          {t("maintenance.reject")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("maintenance.confirmRejectionTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("maintenance.confirmRejectionDesc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("maintenance.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleReject(task)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t("maintenance.confirmReject")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-50 hover:bg-green-100 text-green-600 border-green-300"
                        >
                          {t("maintenance.approve")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("maintenance.confirmApprovalTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("maintenance.confirmApprovalDesc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("maintenance.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleApprove(task)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {t("maintenance.confirmApprove")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-80">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <Input
            className="w-full pl-10" // Add padding for the icon
            placeholder={t("maintenance.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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
            <SelectItem value="in_progress">
              {t("maintenance.inProgress")}
            </SelectItem>
            <SelectItem value="completed">
              {t("maintenance.completed")}
            </SelectItem>
            <SelectItem value="overdue">{t("maintenance.overdue")}</SelectItem>
            <SelectItem value="rejected">
              {t("maintenance.rejected")}
            </SelectItem>
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
