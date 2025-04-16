import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { 
  Vehicle, 
  Maintenance 
} from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, isAfter, isBefore, addDays } from "date-fns";

export default function DriverDashboard() {
  const { user } = useAuth();
  
  // Fetch data for vehicles assigned to current driver
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: [`/api/users/${user?.id}/vehicles`],
    enabled: !!user?.id,
  });
  
  // Fetch maintenance tasks for those vehicles
  const { data: allMaintenance, isLoading: maintenanceLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  });
  
  // Filter maintenance tasks for driver's vehicles
  const driverMaintenance = allMaintenance?.filter(task => {
    const vehicleIds = vehicles?.map(v => v.id) || [];
    return vehicleIds.includes(task.vehicleId);
  });
  
  // Get upcoming maintenance
  const upcomingMaintenance = driverMaintenance
    ?.filter(task => 
      task.status === "pending" && 
      !isAfter(new Date(), new Date(task.dueDate))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
  
  // Get overdue maintenance
  const overdueMaintenance = driverMaintenance
    ?.filter(task => 
      (task.status === "pending" || task.status === "overdue") && 
      isAfter(new Date(), new Date(task.dueDate))
    )
    .slice(0, 3);

  // Function to get vehicle details
  const getVehicleDetails = (vehicleId: number) => {
    return vehicles?.find(v => v.id === vehicleId);
  };
  
  // Function to format due date display
  const formatDueDate = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);
    
    if (isAfter(now, dueDate)) {
      return `Overdue (${format(dueDate, "MMM d")})`;
    }
    
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return `Due on ${format(dueDate, "MMM d")}`;
    }
  };
  
  // Function to get priority badge color
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500 bg-opacity-10 text-red-500">Critical</span>;
      case "high":
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-500 bg-opacity-10 text-amber-500">High</span>;
      case "normal":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500 bg-opacity-10 text-blue-500">Normal</span>;
      case "low":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500 bg-opacity-10 text-green-500">Low</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500 bg-opacity-10 text-gray-500">Unknown</span>;
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

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
        <p className="text-gray-500">View your assigned vehicles and maintenance tasks</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-gray-500 text-sm">Assigned Vehicles</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">
                  {vehiclesLoading ? <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div> : vehicles?.length || 0}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                <span className="material-icons">directions_car</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-gray-500 text-sm">Upcoming Maintenance</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">
                  {maintenanceLoading ? <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div> : upcomingMaintenance?.length || 0}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center text-blue-500">
                <span className="material-icons">build</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-gray-500 text-sm">Overdue Tasks</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">
                  {maintenanceLoading ? <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div> : overdueMaintenance?.length || 0}
                </h3>
                {overdueMaintenance && overdueMaintenance.length > 0 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="material-icons text-sm mr-1">warning</span>
                    Requires attention
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center text-red-500">
                <span className="material-icons">warning</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* My Vehicles */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">My Vehicles</h2>
          <Link to="/maintenance">
            <a className="text-primary text-sm flex items-center">
              View All Maintenance
              <span className="material-icons text-sm ml-1">chevron_right</span>
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiclesLoading ? (
            Array(3).fill(0).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-28"></div>
                </CardContent>
              </Card>
            ))
          ) : vehicles && vehicles.length > 0 ? (
            vehicles.map(vehicle => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <span className="material-icons text-gray-500">{getVehicleIcon(vehicle.type)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
                        <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">VIN:</span>
                        <span className="text-gray-900">{vehicle.vin}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">License:</span>
                        <span className="text-gray-900">{vehicle.licensePlate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mileage:</span>
                        <span className="text-gray-900">{vehicle.mileage.toLocaleString()} miles</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className="text-gray-900 capitalize">{vehicle.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 border-t">
                    <Link to={`/vehicle/${vehicle.id}`}>
                      <a className="w-full">
                        <Button variant="outline" className="w-full">
                          <span className="material-icons text-sm mr-2">visibility</span>
                          View Details
                        </Button>
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <div className="flex flex-col items-center justify-center">
                <span className="material-icons text-4xl text-gray-300 mb-2">directions_car</span>
                <h3 className="text-lg font-medium text-gray-700">No vehicles assigned</h3>
                <p className="text-gray-500 mt-1">You don't have any vehicles assigned to you yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Maintenance Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Overdue Maintenance</h2>
          
          {maintenanceLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-40"></div>
              </CardContent>
            </Card>
          ) : overdueMaintenance && overdueMaintenance.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {overdueMaintenance.map(task => {
                    const vehicle = getVehicleDetails(task.vehicleId);
                    return (
                      <div key={task.id} className="p-4">
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-red-500 bg-opacity-10 flex items-center justify-center text-red-500 mr-3">
                            <span className="material-icons">warning</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{task.description}</h4>
                              {getPriorityBadge(task.priority)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {vehicle ? vehicle.name : `Vehicle #${task.vehicleId}`}
                            </p>
                            <p className="text-sm text-red-500 font-medium mt-1">
                              {formatDueDate(task.dueDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="material-icons text-3xl text-green-500 mb-2">check_circle</span>
                  <h3 className="text-lg font-medium text-gray-700">No overdue tasks</h3>
                  <p className="text-gray-500 mt-1">You're all caught up!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Upcoming Tasks */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Upcoming Maintenance</h2>
          
          {maintenanceLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-40"></div>
              </CardContent>
            </Card>
          ) : upcomingMaintenance && upcomingMaintenance.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {upcomingMaintenance.map(task => {
                    const vehicle = getVehicleDetails(task.vehicleId);
                    return (
                      <div key={task.id} className="p-4">
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center text-blue-500 mr-3">
                            <span className="material-icons">build</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{task.description}</h4>
                              {getPriorityBadge(task.priority)}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {vehicle ? vehicle.name : `Vehicle #${task.vehicleId}`}
                            </p>
                            <p className="text-sm text-blue-500 font-medium mt-1">
                              {formatDueDate(task.dueDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="material-icons text-3xl text-gray-300 mb-2">event_available</span>
                  <h3 className="text-lg font-medium text-gray-700">No upcoming tasks</h3>
                  <p className="text-gray-500 mt-1">You don't have any upcoming maintenance tasks.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
