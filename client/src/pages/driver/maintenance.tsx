/* /client/src/pages/driver/maintenance.tsx */
import { useState, useEffect } from "react"; // Added useEffect
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Maintenance,
  Vehicle,
  Part,
  VehiclePart,
  insertMaintenanceSchema,
  InsertMaintenance, // Added import
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { format, isAfter } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported

// Extend schema for the form
const reportMaintenanceSchema = insertMaintenanceSchema
  .extend({
    selectedParts: z.array(z.number()).optional(), // Array of vehiclePart IDs
    isUnscheduled: z.boolean().optional(), // Add isUnscheduled
  })
  .omit({
    // Fields not set by driver directly in this form
    status: true,
    priority: true,
    assignedTo: true,
    completedDate: true,
    completedMileage: true,
    cost: true,
    bill: true,
    billImageUrl: true,
    approvalStatus: true,
    approvedBy: true,
    dueDate: true, // Due date is for scheduled tasks, not driver reports
  });

type ReportMaintenanceFormValues = z.infer<typeof reportMaintenanceSchema>;

// --- Maintenance Report Form Component ---
function ReportMaintenanceForm({
  vehicles,
  vehiclePartsNeedingMaint,
  onCancel,
  onSuccess,
  isUnscheduled = false,
}: {
  vehicles: Vehicle[];
  vehiclePartsNeedingMaint: VehiclePart[]; // Parts specifically needing maintenance for scheduled report
  onCancel: () => void;
  onSuccess: () => void;
  isUnscheduled?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all parts for potential inclusion in unscheduled reports
  const { data: allParts } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
    enabled: isUnscheduled, // Only fetch if it's an unscheduled report
  });

  // Fetch all vehicle parts for the selected vehicle (for unscheduled reports)
  const [selectedVehicleIdForParts, setSelectedVehicleIdForParts] = useState<
    number | undefined
  >(vehicles[0]?.id);
  const { data: allVehiclePartsForSelectedVehicle } = useQuery<VehiclePart[]>({
    queryKey: [`/api/vehicles/${selectedVehicleIdForParts}/parts`],
    enabled: isUnscheduled && !!selectedVehicleIdForParts,
  });

  const form = useForm<ReportMaintenanceFormValues>({
    resolver: zodResolver(reportMaintenanceSchema),
    defaultValues: {
      vehicleId: vehicles[0]?.id,
      type: isUnscheduled ? "unscheduled_repair" : "part_maintenance", // Default type
      description: isUnscheduled
        ? ""
        : t("maintenance_driver.scheduledMaintenanceDefaultDesc"),
      notes: "",
      isUnscheduled: isUnscheduled,
      selectedParts: isUnscheduled
        ? []
        : vehiclePartsNeedingMaint.map((vp) => vp.id), // Pre-select parts for scheduled
      partsUsed: [], // This will be filled later by admin/mechanic
    },
  });

  // Update vehicle parts list when vehicle changes (for unscheduled)
  const currentVehicleId = form.watch("vehicleId");
  useEffect(() => {
    if (isUnscheduled) {
      setSelectedVehicleIdForParts(currentVehicleId);
      form.reset({ ...form.getValues(), selectedParts: [] }); // Reset selected parts on vehicle change
    }
  }, [currentVehicleId, isUnscheduled, form]);

  const mutation = useMutation({
    mutationFn: async (data: ReportMaintenanceFormValues) => {
      const payload: InsertMaintenance = {
        ...data,
        assignedTo: user?.id, // Assign to the reporting driver initially
        status: isUnscheduled ? "pending" : "pending", // Unscheduled needs approval, scheduled is pending action
        priority: isUnscheduled ? "normal" : "normal", // Default priority, admin can change
        approvalStatus: isUnscheduled ? "pending" : null,
        // Map selectedParts (vehiclePart IDs) to vehiclePartId if needed, or handle in backend
        // For simplicity, we might just pass the description and notes for now.
        // Or, if it's scheduled, link the first part.
        vehiclePartId:
          !isUnscheduled && vehiclePartsNeedingMaint.length > 0
            ? vehiclePartsNeedingMaint[0].id
            : undefined,
        // partsUsed will be updated later
      };
      const response = await apiRequest("POST", "/api/maintenance", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({
        title: t("maintenance_driver.reportSubmittedTitle"),
        description: isUnscheduled
          ? t("maintenance_driver.reportSubmittedDescUnscheduled")
          : t("maintenance_driver.reportSubmittedDescScheduled"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t("maintenance_driver.reportFailedTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("maintenance_driver.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportMaintenanceFormValues) => {
    mutation.mutate(data);
  };

  const partsAvailableForSelection = isUnscheduled
    ? allVehiclePartsForSelectedVehicle || []
    : vehiclePartsNeedingMaint;

  const getPartName = (vehiclePartId: number): string => {
    const vp = allVehiclePartsForSelectedVehicle?.find(
      (v) => v.id === vehiclePartId
    );
    if (!vp) return `ID ${vehiclePartId}`;
    const p = allParts?.find((part) => part.id === vp.partId);
    return p?.name || `Part ID ${vp.partId}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance_driver.selectVehicle")}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
                required
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "maintenance_driver.selectVehiclePlaceholder"
                      )}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.name} ({vehicle.make} {vehicle.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance_driver.descriptionLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("maintenance_driver.descriptionPlaceholder")}
                  {...field}
                  value={field.value ?? ""} // Handle null/undefined
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("maintenance_driver.notesLabelOptional")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("maintenance_driver.notesPlaceholder")}
                  {...field}
                  value={field.value ?? ""} // Handle null/undefined
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Part Selection */}
        <FormField
          control={form.control}
          name="selectedParts"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  {isUnscheduled
                    ? t("maintenance_driver.selectPartsOptional")
                    : t("maintenance_driver.partsIncluded")}
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  {isUnscheduled
                    ? t("maintenance_driver.selectPartsDescUnscheduled")
                    : t("maintenance_driver.selectPartsDescScheduled")}
                </p>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                {partsAvailableForSelection.length > 0 ? (
                  partsAvailableForSelection.map((vp) => (
                    <FormField
                      key={vp.id}
                      control={form.control}
                      name="selectedParts"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={vp.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(vp.id)}
                                onCheckedChange={(checked) => {
                                  // Cannot uncheck pre-selected parts for scheduled maintenance
                                  if (!isUnscheduled && !checked) return;

                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        vp.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: number) => value !== vp.id
                                        )
                                      );
                                }}
                                disabled={!isUnscheduled} // Disable checkbox for scheduled parts
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {getPartName(vp.id)}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("maintenance_driver.noPartsAvailable")}
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("maintenance_driver.cancel")}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <span className="material-icons animate-spin mr-2 text-sm">
                refresh
              </span>
            )}
            {t("maintenance_driver.submitReport")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// --- Main Page Component ---
export default function DriverMaintenance() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [isUnscheduledReport, setIsUnscheduledReport] = useState(false);

  // Fetch data for vehicles assigned to current driver
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: [`/api/users/${user?.id}/vehicles`],
    enabled: !!user?.id,
  });
  const vehicleIds = vehicles?.map((v) => v.id) || [];

  // Fetch maintenance tasks for driver's vehicles
  const { data: driverMaintenance, isLoading: maintenanceLoading } = useQuery<
    Maintenance[]
  >({
    queryKey: ["/api/maintenance", { vehicleIds: vehicleIds.join(",") }], // Include vehicleIds in queryKey
    queryFn: async ({ queryKey }) => {
      // Fetch all maintenance and filter client-side (alternative: backend filtering)
      const allMaint = await apiRequest("GET", "/api/maintenance").then((res) =>
        res.json()
      );
      return allMaint.filter((task: Maintenance) =>
        vehicleIds.includes(task.vehicleId)
      );
    },
    enabled: !!user?.id && vehicleIds.length > 0,
  });

  // Fetch vehicle parts needing maintenance for the driver's vehicles
  const { data: vehiclePartsNeedingMaint, isLoading: partsLoading } = useQuery<
    VehiclePart[]
  >({
    queryKey: ["/api/vehicle-parts/due", { vehicleIds: vehicleIds.join(",") }],
    queryFn: async () => {
      // This endpoint needs to be created on the backend
      const response = await apiRequest(
        "GET",
        `/api/vehicle-parts/due?vehicleIds=${vehicleIds.join(",")}`
      );
      return response.json();
    },
    enabled: vehicleIds.length > 0,
  });

  // Apply filters to maintenance tasks
  const filteredMaintenance = driverMaintenance?.filter((task) => {
    // Search filter
    const matchesSearch =
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.vehicleId.toString().includes(searchTerm);

    // Status filter
    const isOverdue =
      task.dueDate && isAfter(new Date(), new Date(task.dueDate));
    const matchesStatus =
      statusFilter === "all" ||
      task.status === statusFilter ||
      (statusFilter === "upcoming" &&
        (task.status === "pending" || task.status === "scheduled") &&
        !isOverdue) ||
      (statusFilter === "overdue" &&
        isOverdue &&
        (task.status === "pending" || task.status === "scheduled"));

    return matchesSearch && matchesStatus;
  });

  // Function to get vehicle details
  const getVehicleDetails = (vehicleId: number) => {
    return vehicles?.find((v) => v.id === vehicleId);
  };

  // Function to format due date display
  const formatDueDate = (date: Date | null) => {
    if (!date) return t("maintenance_driver.noDueDate");
    const now = new Date();
    const dueDate = new Date(date);

    if (isAfter(now, dueDate)) {
      return t("dashboard_driver.overdueDate", {
        date: format(dueDate, "MMM d"),
      });
    }

    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return t("dashboard_driver.dueToday");
    } else if (diffDays === 1) {
      return t("dashboard_driver.dueTomorrow");
    } else if (diffDays <= 7) {
      return t("dashboard_driver.dueInDays", { count: diffDays });
    } else {
      return t("dashboard_driver.dueOnDate", {
        date: format(dueDate, "MMM d"),
      });
    }
  };

  // Function to get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">{t("maintenance.critical")}</Badge>;
      case "high":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            {t("maintenance.high")}
          </Badge>
        );
      case "normal":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            {t("maintenance.normal")}
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            {t("maintenance.low")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{t("maintenance.unknown")}</Badge>;
    }
  };

  // Function to get vehicle icon based on type
  const getVehicleIcon = (type?: string) => {
    switch (type) {
      case "truck":
        return "local_shipping";
      case "van":
        return "airport_shuttle";
      default:
        return "directions_car";
    }
  };

  const openReportForm = (unscheduled: boolean) => {
    setIsUnscheduledReport(unscheduled);
    setIsReportFormOpen(true);
  };

  const isLoading = maintenanceLoading || vehiclesLoading || partsLoading;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("maintenance_driver.title")}
          </h1>
          <p className="text-gray-500">{t("maintenance_driver.description")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => openReportForm(false)}
            disabled={
              !vehiclePartsNeedingMaint || vehiclePartsNeedingMaint.length === 0
            }
          >
            <span className="material-icons text-sm mr-1">schedule</span>
            {t("maintenance_driver.reportScheduled")} (
            {vehiclePartsNeedingMaint?.length || 0})
          </Button>
          <Button variant="outline" onClick={() => openReportForm(true)}>
            <span className="material-icons text-sm mr-1">report_problem</span>
            {t("maintenance_driver.reportUnscheduled")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-80">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <Input
            className="w-full pl-10" // Add padding for the icon
            placeholder={t("maintenance_driver.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t("maintenance_driver.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("maintenance_driver.allTasks")}
            </SelectItem>
            <SelectItem value="upcoming">
              {t("maintenance_driver.upcoming")}
            </SelectItem>
            <SelectItem value="overdue">
              {t("maintenance_driver.overdue")}
            </SelectItem>
            <SelectItem value="completed">
              {t("maintenance_driver.completed")}
            </SelectItem>
            <SelectItem value="pending">
              {t("maintenance_driver.pendingApproval")} {/* For unscheduled */}
            </SelectItem>
            <SelectItem value="rejected">
              {t("maintenance_driver.rejected")} {/* For unscheduled */}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-20"></div>
                </CardContent>
              </Card>
            ))
        ) : filteredMaintenance && filteredMaintenance.length > 0 ? (
          filteredMaintenance.map((task) => {
            const vehicle = getVehicleDetails(task.vehicleId);
            const isOverdue =
              task.dueDate && isAfter(new Date(), new Date(task.dueDate));

            return (
              <Card key={task.id} className={isOverdue ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        task.status === "completed"
                          ? "bg-green-500 bg-opacity-10 text-green-500"
                          : task.status === "rejected"
                          ? "bg-red-500 bg-opacity-10 text-red-500"
                          : isOverdue
                          ? "bg-red-500 bg-opacity-10 text-red-500"
                          : task.approvalStatus === "pending"
                          ? "bg-amber-500 bg-opacity-10 text-amber-500"
                          : "bg-blue-500 bg-opacity-10 text-blue-500"
                      }`}
                    >
                      <span className="material-icons">
                        {task.status === "completed"
                          ? "check_circle"
                          : task.status === "rejected"
                          ? "cancel"
                          : isOverdue
                          ? "warning"
                          : task.approvalStatus === "pending"
                          ? "pending_actions"
                          : "build"}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {task.description}
                        </h3>
                        <div className="mt-2 md:mt-0 flex items-center gap-2">
                          {task.isUnscheduled && task.approvalStatus && (
                            <Badge
                              variant={
                                task.approvalStatus === "approved"
                                  ? "default"
                                  : task.approvalStatus === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {t(
                                `maintenance_driver.approval_${task.approvalStatus}`
                              )}
                            </Badge>
                          )}
                          {getPriorityBadge(task.priority)}
                          <span
                            className={`text-sm font-medium ${
                              isOverdue ? "text-red-500" : "text-blue-500"
                            }`}
                          >
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center">
                        <span className="material-icons text-gray-400 mr-1 text-sm">
                          {getVehicleIcon(vehicle?.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {vehicle
                            ? vehicle.name
                            : `Vehicle #${task.vehicleId}`}
                        </span>
                      </div>

                      {task.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">
                            {t("maintenance_driver.notesPrefix")}
                          </span>{" "}
                          {task.notes}
                        </p>
                      )}

                      <div className="mt-4 space-x-2">
                        {task.status !== "completed" &&
                          task.status !== "rejected" &&
                          task.approvalStatus !== "pending" && (
                            <Button variant="outline" size="sm">
                              <span className="material-icons text-sm mr-1">
                                check
                              </span>
                              {t("maintenance_driver.markComplete")}
                            </Button>
                          )}
                        <Button variant="ghost" size="sm">
                          <span className="material-icons text-sm mr-1">
                            visibility
                          </span>
                          {t("maintenance_driver.viewDetails")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-6">
                <span className="material-icons text-5xl text-gray-300 mb-3">
                  build
                </span>
                <h3 className="text-lg font-medium text-gray-700">
                  {t("maintenance_driver.noTasksFound")}
                </h3>
                <p className="text-gray-500 mt-1">
                  {searchTerm || statusFilter !== "all"
                    ? t("maintenance_driver.adjustFilters")
                    : t("maintenance_driver.noTasksAssigned")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Maintenance Dialog */}
      <Dialog open={isReportFormOpen} onOpenChange={setIsReportFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isUnscheduledReport
                ? t("maintenance_driver.reportUnscheduledTitle")
                : t("maintenance_driver.reportScheduledTitle")}
            </DialogTitle>
            <DialogDescription>
              {isUnscheduledReport
                ? t("maintenance_driver.reportUnscheduledDesc")
                : t("maintenance_driver.reportScheduledDesc")}
            </DialogDescription>
          </DialogHeader>
          {vehicles &&
          vehicles.length > 0 &&
          (vehiclePartsNeedingMaint || isUnscheduledReport) ? (
            <ReportMaintenanceForm
              vehicles={vehicles}
              vehiclePartsNeedingMaint={vehiclePartsNeedingMaint || []}
              onCancel={() => setIsReportFormOpen(false)}
              onSuccess={() => setIsReportFormOpen(false)}
              isUnscheduled={isUnscheduledReport}
            />
          ) : (
            <p className="text-center text-red-500 py-4">
              {t("maintenance_driver.cannotReportError")}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
