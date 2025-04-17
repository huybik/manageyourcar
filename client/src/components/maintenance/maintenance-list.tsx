/* /client/src/components/maintenance/maintenance-list.tsx */
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { User, Vehicle, Maintenance } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { format, isAfter } from "date-fns";
import { useTranslation } from "react-i18next";

interface MaintenanceWithDetails extends Maintenance {
  vehicle?: Vehicle;
  assignedToUser?: User;
}

export default function MaintenanceList({
  title = "Maintenance Tasks",
  viewAll = true,
  limit = 0,
  showActions = true,
  filter = "all", // all, pending, overdue, completed
}) {
  const { t } = useTranslation();
  const { data: maintenanceTasks, isLoading: tasksLoading } = useQuery<
    Maintenance[]
  >({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = tasksLoading || vehiclesLoading || usersLoading;

  // Function to format the due date display
  const formatDueDate = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);

    if (isAfter(now, dueDate)) {
      return t("maintenance.overdueDate", { date: format(dueDate, "MMM d") });
    }

    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return t("maintenance.dueToday");
    } else if (diffDays === 1) {
      return t("maintenance.dueTomorrow");
    } else if (diffDays <= 7) {
      return t("maintenance.dueInDays", { count: diffDays });
    } else {
      return t("maintenance.dueOnDate", { date: format(dueDate, "MMM d") });
    }
  };

  // Function to get the status color based on priority
  const getStatusBgColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 bg-opacity-10 text-red-500";
      case "high":
        return "bg-amber-500 bg-opacity-10 text-amber-500";
      case "normal":
        return "bg-blue-500 bg-opacity-10 text-blue-500";
      case "low":
        return "bg-green-500 bg-opacity-10 text-green-500";
      default:
        return "bg-gray-500 bg-opacity-10 text-gray-500";
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

  // Combine maintenance tasks with vehicle and user details
  const maintenanceWithDetails: MaintenanceWithDetails[] = !isLoading
    ? (maintenanceTasks || []).map((task) => ({
        ...task,
        vehicle: vehicles?.find((v) => v.id === task.vehicleId),
        assignedToUser: users?.find((u) => u.id === task.assignedTo),
      }))
    : [];

  // Apply filters
  let filteredTasks = maintenanceWithDetails;

  if (filter === "pending") {
    filteredTasks = maintenanceWithDetails.filter(
      (task) => task.status === "pending"
    );
  } else if (filter === "overdue") {
    filteredTasks = maintenanceWithDetails.filter(
      (task) => task.status === "overdue"
    );
  } else if (filter === "completed") {
    filteredTasks = maintenanceWithDetails.filter(
      (task) => task.status === "completed"
    );
  }

  // Apply limit if specified
  if (limit > 0) {
    filteredTasks = filteredTasks.slice(0, limit);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {viewAll && (
          <a
            href="/maintenance"
            className="text-primary text-sm flex items-center"
          >
            {t("dashboard_company.viewAll")}
            <span className="material-icons text-sm ml-1">chevron_right</span>
          </a>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("maintenance.vehicle")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("maintenance.maintenanceType")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("maintenance.dueDate")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("maintenance.status")}
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("maintenance.assignedTo")}
                </th>
                {showActions && (
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("maintenance.action")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                // Loading state
                Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-32"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </td>
                      {showActions && (
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </td>
                      )}
                    </tr>
                  ))
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="material-icons text-gray-500 mr-2">
                          {getVehicleIcon(task.vehicle?.type)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {task.vehicle?.name || `Vehicle #${task.vehicleId}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("maintenance.vinPrefix")}{" "}
                            {task.vehicle?.vin || t("maintenance.unknown")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {task.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          task.status === "overdue"
                            ? "text-red-500"
                            : isAfter(new Date(), new Date(task.dueDate))
                            ? "text-red-500"
                            : "text-gray-900"
                        }`}
                      >
                        {formatDueDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBgColor(
                          task.priority
                        )}`}
                      >
                        {task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            task.assignedToUser?.profileImage ||
                            "https://via.placeholder.com/40"
                          }
                          alt={task.assignedToUser?.name || "User"}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-sm text-gray-900">
                          {task.assignedToUser?.name ||
                            t("maintenance.unassigned")}
                        </span>
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary text-sm font-medium"
                        >
                          {t("maintenance.schedule")}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={showActions ? 6 : 5}
                    className="px-4 py-3 text-center text-gray-500"
                  >
                    {t("maintenance.noTasksFound")}
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
