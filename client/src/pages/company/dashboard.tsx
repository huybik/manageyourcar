import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  Vehicle, 
  Part, 
  Maintenance, 
  ActivityLog 
} from "@shared/schema";
import StatCard from "@/components/ui/stat-card";
import MaintenanceList from "@/components/maintenance/maintenance-list";
import { Button } from "@/components/ui/button";
import { format, formatDistance } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("30");
  
  // Fetch data
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  
  const { data: parts } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });
  
  const { data: pendingMaintenance } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance/pending"],
  });
  
  const { data: lowStockParts } = useQuery<Part[]>({
    queryKey: ["/api/parts/low-stock"],
  });
  
  const { data: recentActivity } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs/recent"],
  });
  
  // Calculate stats
  const totalVehicles = vehicles?.length || 0;
  const totalParts = parts?.length || 0;
  const pendingMaintenanceCount = pendingMaintenance?.length || 0;
  const lowStockCount = lowStockParts?.length || 0;
  
  // Function to get activity icon
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "maintenance_completed":
        return "build";
      case "inventory_added":
        return "inventory";
      case "order_placed":
        return "shopping_cart";
      case "issue_reported":
        return "directions_car";
      default:
        return "info";
    }
  };
  
  // Function to get activity icon color
  const getActivityIconColor = (action: string) => {
    switch (action) {
      case "maintenance_completed":
        return "bg-primary bg-opacity-10 text-primary";
      case "inventory_added":
        return "bg-blue-500 bg-opacity-10 text-blue-500";
      case "order_placed":
        return "bg-amber-500 bg-opacity-10 text-amber-500";
      case "issue_reported":
        return "bg-orange-500 bg-opacity-10 text-orange-500";
      default:
        return "bg-gray-500 bg-opacity-10 text-gray-500";
    }
  };
  
  // Function to get activity label
  const getActivityLabel = (action: string) => {
    switch (action) {
      case "maintenance_completed":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500 bg-opacity-10 text-green-500">Maintenance</span>;
      case "inventory_added":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500 bg-opacity-10 text-blue-500">Inventory</span>;
      case "order_placed":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 bg-opacity-10 text-amber-500">Purchase</span>;
      case "issue_reported":
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 bg-opacity-10 text-red-500">Issue</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500 bg-opacity-10 text-gray-500">Activity</span>;
    }
  };

  const formatActivityTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, "h:mm a")}`;
    }
    
    if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    }
    
    return format(date, "MMM d, h:mm a");
  };

  // Critical items for inventory
  const criticalItems = lowStockParts?.slice(0, 3) || [];

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Company Dashboard</h1>
          <p className="text-gray-500">Overview of your fleet</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative">
            <Button variant="outline" size="sm" className="flex items-center">
              <span className="material-icons text-gray-500 mr-1 text-sm">date_range</span>
              Last {timeframe} Days
              <span className="material-icons text-gray-500 ml-1 text-sm">arrow_drop_down</span>
            </Button>
          </div>
          <Button size="sm" className="flex items-center">
            <span className="material-icons text-sm mr-1">add</span>
            New Vehicle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Vehicles"
          value={totalVehicles}
          icon="directions_car"
          iconColor="primary"
          changeText="+2 since last month"
          changeDirection="up"
        />
        <StatCard
          title="Parts in Inventory"
          value={totalParts}
          icon="inventory_2"
          iconColor="info"
          changeText="+24 since last month"
          changeDirection="up"
        />
        <StatCard
          title="Pending Maintenance"
          value={pendingMaintenanceCount}
          icon="build"
          iconColor="warning"
          status={pendingMaintenance && pendingMaintenance.filter(m => m.priority === "critical" || m.priority === "high").length > 0 
            ? `${pendingMaintenance.filter(m => m.priority === "critical" || m.priority === "high").length} are high priority` 
            : undefined}
        />
        <StatCard
          title="Parts to Reorder"
          value={lowStockCount}
          icon="shopping_cart"
          iconColor="error"
          status={lowStockParts && lowStockParts.filter(p => p.quantity <= p.minimumStock * 0.25).length > 0 
            ? `${lowStockParts.filter(p => p.quantity <= p.minimumStock * 0.25).length} below threshold` 
            : undefined}
        />
      </div>

      {/* Maintenance Alerts Section */}
      <div className="mb-6">
        <MaintenanceList 
          title="Maintenance Alerts" 
          limit={3}
          filter="pending"
        />
      </div>

      {/* Bottom Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Inventory Status</h2>
            <a href="/inventory" className="text-primary text-sm flex items-center">
              Manage Inventory
              <span className="material-icons text-sm ml-1">chevron_right</span>
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* Low Stock Alert */}
            {lowStockParts && lowStockParts.length > 0 ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 border-opacity-20 rounded-md">
                <div className="flex items-start">
                  <span className="material-icons text-red-500 mr-2">error_outline</span>
                  <div>
                    <h4 className="text-red-500 font-medium text-sm">Low Stock Alert</h4>
                    <p className="text-gray-800 text-sm mt-1">{lowStockParts.length} items below reorder threshold</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto text-primary text-sm font-medium">Order Now</Button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 border-opacity-20 rounded-md">
                <div className="flex items-start">
                  <span className="material-icons text-green-500 mr-2">check_circle</span>
                  <div>
                    <h4 className="text-green-500 font-medium text-sm">Stock Levels Good</h4>
                    <p className="text-gray-800 text-sm mt-1">All inventory items are at acceptable levels</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Low Stock Items */}
            <h4 className="font-medium text-gray-800 mb-3">Critical Items</h4>
            <div className="space-y-3">
              {criticalItems.length > 0 ? (
                criticalItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-red-500 rounded-full h-2" 
                          style={{ 
                            width: `${Math.min(100, (item.quantity / item.minimumStock) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-red-500 text-sm font-medium">{item.quantity}/{item.minimumStock}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No critical items to display</div>
              )}

              <Button variant="outline" className="w-full mt-2 text-primary text-sm font-medium flex items-center justify-center py-2">
                <span className="material-icons text-sm mr-1">add_shopping_cart</span>
                Create Purchase Order
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <a href="#" className="text-primary text-sm flex items-center">
              View All
              <span className="material-icons text-sm ml-1">chevron_right</span>
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 4).map(activity => (
                  <div key={activity.id} className="flex">
                    <div className="flex-shrink-0 mr-3">
                      <div className={`w-10 h-10 rounded-full ${getActivityIconColor(activity.action)} flex items-center justify-center`}>
                        <span className="material-icons">{getActivityIcon(activity.action)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.userId === user?.id ? "You" : activity.description.split(" ")[0]}</span> {' '}
                        {activity.description.substring(activity.description.indexOf(" ") + 1)}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500">{formatActivityTime(activity.timestamp)}</span>
                        <span className="mx-2 text-gray-500">•</span>
                        {getActivityLabel(activity.action)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No recent activity to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
