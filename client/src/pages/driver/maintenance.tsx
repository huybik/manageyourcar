import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Maintenance, Vehicle } from "@shared/schema";
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

export default function DriverMaintenance() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
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
  
  // Apply filters to maintenance tasks
  const filteredMaintenance = driverMaintenance?.filter(task => {
    // Search filter
    const matchesSearch = 
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.vehicleId.toString().includes(searchTerm);
    
    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      task.status === statusFilter ||
      (statusFilter === "upcoming" && task.status === "pending" && !isAfter(new Date(), new Date(task.dueDate))) ||
      (statusFilter === "overdue" && isAfter(new Date(), new Date(task.dueDate)));
    
    return matchesSearch && matchesStatus;
  });
  
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
        <h1 className="text-2xl font-bold text-gray-800">My Maintenance Tasks</h1>
        <p className="text-gray-500">Track and manage vehicle maintenance</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          className="w-full md:w-80"
          placeholder="Search maintenance tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Tasks List */}
      <div className="space-y-4">
        {maintenanceLoading || vehiclesLoading ? (
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredMaintenance && filteredMaintenance.length > 0 ? (
          filteredMaintenance.map(task => {
            const vehicle = getVehicleDetails(task.vehicleId);
            const isOverdue = isAfter(new Date(), new Date(task.dueDate));
            
            return (
              <Card key={task.id} className={isOverdue ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      isOverdue 
                        ? "bg-red-500 bg-opacity-10 text-red-500" 
                        : task.status === "completed"
                          ? "bg-green-500 bg-opacity-10 text-green-500"
                          : "bg-blue-500 bg-opacity-10 text-blue-500"
                    }`}>
                      <span className="material-icons">
                        {isOverdue ? "warning" : task.status === "completed" ? "check_circle" : "build"}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <h3 className="text-lg font-medium text-gray-900">{task.description}</h3>
                        <div className="mt-2 md:mt-0 flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          <span className={`text-sm font-medium ${
                            isOverdue ? "text-red-500" : "text-blue-500"
                          }`}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        <span className="material-icons text-gray-400 mr-1 text-sm">
                          {getVehicleIcon(vehicle?.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {vehicle ? vehicle.name : `Vehicle #${task.vehicleId}`}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </p>
                      )}
                      
                      <div className="mt-4 space-x-2">
                        {task.status !== "completed" && (
                          <Button variant="outline" size="sm">
                            <span className="material-icons text-sm mr-1">check</span>
                            Mark Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <span className="material-icons text-sm mr-1">visibility</span>
                          View Details
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
                <span className="material-icons text-5xl text-gray-300 mb-3">build</span>
                <h3 className="text-lg font-medium text-gray-700">No maintenance tasks found</h3>
                <p className="text-gray-500 mt-1">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters"
                    : "You don't have any maintenance tasks assigned to your vehicles"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
