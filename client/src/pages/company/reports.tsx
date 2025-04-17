/* /client/src/pages/company/reports.tsx */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, Part, Maintenance, Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

export default function ReportsPage() {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState("inventory");
  const [timeframe, setTimeframe] = useState("month");

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: parts } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const { data: maintenance } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Inventory Distribution by Category
  const inventoryCategoryData = parts
    ? Object.entries(
        parts.reduce((acc: Record<string, number>, part) => {
          acc[part.category] = (acc[part.category] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Vehicle Types Distribution
  const vehicleTypeData = vehicles
    ? Object.entries(
        vehicles.reduce((acc: Record<string, number>, vehicle) => {
          acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Maintenance by Priority
  const maintenancePriorityData = maintenance
    ? Object.entries(
        maintenance.reduce((acc: Record<string, number>, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Order Status Distribution
  const orderStatusData = orders
    ? Object.entries(
        orders.reduce((acc: Record<string, number>, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : [];

  // Mock data for monthly trends (in a real app, this would come from API)
  const monthlyMaintenanceData = [
    { month: "Jan", completed: 12, scheduled: 15 },
    { month: "Feb", completed: 15, scheduled: 18 },
    { month: "Mar", completed: 18, scheduled: 20 },
    { month: "Apr", completed: 14, scheduled: 16 },
    { month: "May", completed: 16, scheduled: 19 },
    { month: "Jun", completed: 19, scheduled: 22 },
  ];

  const monthlyInventoryData = [
    { month: "Jan", added: 45, used: 38 },
    { month: "Feb", added: 52, used: 43 },
    { month: "Mar", added: 48, used: 41 },
    { month: "Apr", added: 56, used: 52 },
    { month: "May", added: 62, used: 57 },
    { month: "Jun", added: 58, used: 51 },
  ];

  const monthlyOrdersData = [
    { month: "Jan", value: 5, amount: 2340 },
    { month: "Feb", value: 7, amount: 3240 },
    { month: "Mar", value: 4, amount: 1870 },
    { month: "Apr", value: 8, amount: 4320 },
    { month: "May", value: 9, amount: 5150 },
    { month: "Jun", value: 6, amount: 2890 },
  ];

  // Colors for pie charts
  const COLORS = [
    "#1976D2",
    "#388E3C",
    "#F57C00",
    "#F44336",
    "#673AB7",
    "#2196F3",
  ];

  // Function to export data to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Convert data to CSV format
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers (keys of the first object)
    const headers = Object.keys(data[0]);
    csvContent += headers.join(",") + "\n";

    // Add rows
    data.forEach((item) => {
      const row = headers.map((header) => {
        // Convert value to string and handle values with commas
        const value = item[header]?.toString() || "";
        return value.includes(",") ? `"${value}"` : value;
      });
      csvContent += row.join(",") + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("reports.title")}
        </h1>
        <p className="text-gray-500">{t("reports.description")}</p>
      </div>

      {/* Report Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t("reports.reportType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory">
                {t("reports.inventory")}
              </SelectItem>
              <SelectItem value="maintenance">
                {t("reports.maintenance")}
              </SelectItem>
              <SelectItem value="vehicles">{t("reports.vehicles")}</SelectItem>
              <SelectItem value="orders">{t("reports.orders")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t("reports.timeframe")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("reports.lastWeek")}</SelectItem>
              <SelectItem value="month">{t("reports.lastMonth")}</SelectItem>
              <SelectItem value="quarter">
                {t("reports.lastQuarter")}
              </SelectItem>
              <SelectItem value="year">{t("reports.lastYear")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            // Export data based on the current report type
            if (reportType === "inventory" && parts) {
              exportToCSV(parts, "inventory_report");
            } else if (reportType === "maintenance" && maintenance) {
              exportToCSV(maintenance, "maintenance_report");
            } else if (reportType === "vehicles" && vehicles) {
              exportToCSV(vehicles, "vehicles_report");
            } else if (reportType === "orders" && orders) {
              exportToCSV(orders, "orders_report");
            }
          }}
        >
          <span className="material-icons text-sm mr-1">file_download</span>
          {t("reports.exportReport")}
        </Button>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {reportType === "inventory" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.inventoryByCategory")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryCategoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {inventoryCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} parts`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.inventoryLevels")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={parts?.slice(0, 10).map((part) => ({
                        name:
                          part.name.length > 20
                            ? part.name.substring(0, 20) + "..."
                            : part.name,
                        current: part.quantity,
                        minimum: part.minimumStock,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="current"
                        name={t("reports.currentStock")}
                        fill="#1976D2"
                      />
                      <Bar
                        dataKey="minimum"
                        name={t("reports.minimumLevel")}
                        fill="#F57C00"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.monthlyInventoryTrends")}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyInventoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="added"
                      name={t("reports.partsAdded")}
                      stroke="#1976D2"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="used"
                      name={t("reports.partsUsed")}
                      stroke="#F57C00"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "maintenance" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.maintenanceByPriority")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={maintenancePriorityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {maintenancePriorityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} tasks`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.maintenanceByStatus")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          maintenance
                            ? Object.entries(
                                maintenance.reduce(
                                  (acc: Record<string, number>, task) => {
                                    acc[task.status] =
                                      (acc[task.status] || 0) + 1;
                                    return acc;
                                  },
                                  {}
                                )
                              ).map(([name, value]) => ({ name, value }))
                            : []
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(maintenance
                          ? Object.entries(
                              maintenance.reduce(
                                (acc: Record<string, number>, task) => {
                                  acc[task.status] =
                                    (acc[task.status] || 0) + 1;
                                  return acc;
                                },
                                {}
                              )
                            ).map(([name, value]) => ({ name, value }))
                          : []
                        ).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} tasks`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.monthlyMaintenanceTrends")}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyMaintenanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="scheduled"
                      name={t("reports.scheduled")}
                      stroke="#1976D2"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name={t("reports.completed")}
                      stroke="#388E3C"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "vehicles" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.vehiclesByType")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {vehicleTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} vehicles`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.vehiclesByStatus")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          vehicles
                            ? Object.entries(
                                vehicles.reduce(
                                  (acc: Record<string, number>, vehicle) => {
                                    acc[vehicle.status] =
                                      (acc[vehicle.status] || 0) + 1;
                                    return acc;
                                  },
                                  {}
                                )
                              ).map(([name, value]) => ({ name, value }))
                            : []
                        }
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(vehicles
                          ? Object.entries(
                              vehicles.reduce(
                                (acc: Record<string, number>, vehicle) => {
                                  acc[vehicle.status] =
                                    (acc[vehicle.status] || 0) + 1;
                                  return acc;
                                },
                                {}
                              )
                            ).map(([name, value]) => ({ name, value }))
                          : []
                        ).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} vehicles`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.vehicleMileageComparison")}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicles?.slice(0, 10).map((vehicle) => ({
                      name: vehicle.name,
                      mileage: vehicle.mileage,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="mileage"
                      name={t("reports.mileage")}
                      fill="#1976D2"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "orders" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.ordersByStatus")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} orders`, "Count"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.monthlyOrderVolume")}</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyOrdersData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name={t("reports.orders")}
                        fill="#1976D2"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.monthlyOrderAmount")}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyOrdersData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name={t("reports.orderAmount")}
                      stroke="#1976D2"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
