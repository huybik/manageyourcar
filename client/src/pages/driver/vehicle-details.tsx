import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Vehicle, Maintenance } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isAfter } from "date-fns";

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id);
  const { user } = useAuth();
  
  // Fetch vehicle details
  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
    enabled: !isNaN(vehicleId),
  });
  
  // Fetch maintenance for this vehicle
  const { data: vehicleMaintenance, isLoading: maintenanceLoading } = useQuery<Maintenance[]>({
    queryKey: [`/api/vehicles/${vehicleId}/maintenance`],
    enabled: !isNaN(vehicleId),
  });
  
  // Check if the vehicle is assigned to the current user
  const isAssignedToUser = vehicle?.assignedTo === user?.id;
  
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
  
  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 bg-opacity-10 text-green-500";
      case "maintenance":
        return "bg-amber-500 bg-opacity-10 text-amber-500";
      case "out_of_service":
        return "bg-red-500 bg-opacity-10 text-red-500";
      default:
        return "bg-gray-500 bg-opacity-10 text-gray-500";
    }
  };
  
  // If the vehicle doesn't exist or is not assigned to the user
  if (!isNaN(vehicleId) && !vehicleLoading && (!vehicle || !isAssignedToUser)) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-10">
          <div className="flex flex-col items-center justify-center">
            <span className="material-icons text-5xl text-gray-300 mb-3">error_outline</span>
            <h3 className="text-xl font-medium text-gray-700">Vehicle Not Found</h3>
            <p className="text-gray-500 mt-1">This vehicle doesn't exist or is not assigned to you.</p>
            <Link to="/">
              <a className="mt-4">
                <Button>
                  <span className="material-icons text-sm mr-1">arrow_back</span>
                  Back to Dashboard
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <Link to="/">
          <a className="mr-4">
            <Button variant="ghost" size="icon">
              <span className="material-icons">arrow_back</span>
            </Button>
          </a>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {vehicleLoading ? (
              <div className="h-8 w-40 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              vehicle?.name
            )}
          </h1>
          <p className="text-gray-500">
            {vehicleLoading ? (
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              `${vehicle?.make} ${vehicle?.model} (${vehicle?.year})`
            )}
          </p>
        </div>
      </div>
      
      {/* Vehicle Details and Tabs */}
      <div className="space-y-6">
        {/* Vehicle Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column - Basic info */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                    <span className="material-icons text-gray-500 text-2xl">
                      {vehicleLoading ? "" : getVehicleIcon(vehicle?.type)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {vehicleLoading ? (
                        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                      ) : (
                        vehicle?.type.charAt(0).toUpperCase() + vehicle?.type.slice(1)
                      )}
                    </h3>
                    {!vehicleLoading && vehicle && (
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status.replace("_", " ").charAt(0).toUpperCase() + vehicle.status.replace("_", " ").slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                
                {vehicleLoading ? (
                  <div className="space-y-3">
                    {Array(5).fill(0).map((_, index) => (
                      <div key={index} className="h-6 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">VIN</span>
                      <span className="text-gray-900 font-medium">{vehicle?.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">License Plate</span>
                      <span className="text-gray-900 font-medium">{vehicle?.licensePlate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Make/Model</span>
                      <span className="text-gray-900 font-medium">{vehicle?.make} {vehicle?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year</span>
                      <span className="text-gray-900 font-medium">{vehicle?.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mileage</span>
                      <span className="text-gray-900 font-medium">{vehicle?.mileage.toLocaleString()} miles</span>
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <span className="material-icons text-sm mr-1">update</span>
                    Update Mileage
                  </Button>
                </div>
              </div>
              
              {/* Middle column - Maintenance info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Maintenance Information</h3>
                
                {vehicleLoading ? (
                  <div className="space-y-3">
                    {Array(4).fill(0).map((_, index) => (
                      <div key={index} className="h-6 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Maintenance Date</span>
                      <span className="text-gray-900 font-medium">
                        {vehicle?.nextMaintenanceDate ? format(new Date(vehicle.nextMaintenanceDate), "MMM dd, yyyy") : 'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Maintenance Mileage</span>
                      <span className="text-gray-900 font-medium">
                        {vehicle?.nextMaintenanceMileage ? `${vehicle.nextMaintenanceMileage.toLocaleString()} miles` : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pending Maintenance</span>
                      <span className="text-gray-900 font-medium">
                        {maintenanceLoading 
                          ? '...' 
                          : vehicleMaintenance?.filter(m => m.status === "pending" || m.status === "overdue").length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Days Until Next Service</span>
                      <span className={`font-medium ${
                        vehicle?.nextMaintenanceDate && new Date(vehicle.nextMaintenanceDate) < new Date() 
                          ? 'text-red-500' 
                          : 'text-gray-900'
                      }`}>
                        {vehicle?.nextMaintenanceDate
                          ? new Date(vehicle.nextMaintenanceDate) < new Date()
                            ? 'Overdue'
                            : `${Math.ceil((new Date(vehicle.nextMaintenanceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                          : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center pt-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 rounded-full bg-primary"
                      style={{ 
                        width: vehicle && vehicle.mileage && vehicle.nextMaintenanceMileage
                          ? `${Math.min(100, (vehicle.mileage / vehicle.nextMaintenanceMileage) * 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    {vehicle && vehicle.mileage && vehicle.nextMaintenanceMileage
                      ? `${Math.floor((vehicle.mileage / vehicle.nextMaintenanceMileage) * 100)}% to next service`
                      : 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Right column - Issues/Reports */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Issues & Reports</h3>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <span className="material-icons text-red-500 mr-2">report_problem</span>
                    Report an Issue
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <span className="material-icons text-amber-500 mr-2">construction</span>
                    Request Maintenance
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <span className="material-icons text-green-500 mr-2">fact_check</span>
                    Complete Inspection
                  </Button>
                </div>
                
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Issues</h4>
                  
                  {vehicleLoading || maintenanceLoading ? (
                    <div className="space-y-2">
                      {Array(2).fill(0).map((_, index) => (
                        <div key={index} className="h-16 bg-gray-200 animate-pulse rounded"></div>
                      ))}
                    </div>
                  ) : vehicleMaintenance && vehicleMaintenance.filter(m => m.notes && m.notes.includes("issue")).length > 0 ? (
                    <div className="space-y-2">
                      {vehicleMaintenance
                        .filter(m => m.notes && m.notes.includes("issue"))
                        .slice(0, 2)
                        .map(issue => (
                          <div key={issue.id} className="p-2 bg-gray-50 rounded-md text-sm">
                            <div className="font-medium text-gray-900">{issue.description}</div>
                            <div className="text-gray-500 mt-1">{issue.notes}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No recent issues reported</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Maintenance History Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {maintenanceLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="h-20 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : vehicleMaintenance && vehicleMaintenance.filter(m => m.status === "pending" || m.status === "scheduled").length > 0 ? (
                  <div className="divide-y">
                    {vehicleMaintenance
                      .filter(m => m.status === "pending" || m.status === "scheduled")
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map(task => (
                        <div key={task.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                              isAfter(new Date(), new Date(task.dueDate))
                                ? "bg-red-500 bg-opacity-10 text-red-500"
                                : "bg-blue-500 bg-opacity-10 text-blue-500"
                            }`}>
                              <span className="material-icons">
                                {isAfter(new Date(), new Date(task.dueDate)) ? "warning" : "build"}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{task.description}</h3>
                                  <p className="text-sm text-gray-500 mt-1">{task.notes || "No additional notes"}</p>
                                </div>
                                <div className="mt-2 md:mt-0 flex items-center gap-2">
                                  {getPriorityBadge(task.priority)}
                                  <span className={`text-sm font-medium ${
                                    isAfter(new Date(), new Date(task.dueDate)) ? "text-red-500" : "text-blue-500"
                                  }`}>
                                    {formatDueDate(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex gap-2">
                                <Button variant="outline" size="sm">
                                  <span className="material-icons text-sm mr-1">check</span>
                                  Mark Complete
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <span className="material-icons text-sm mr-1">schedule</span>
                                  Reschedule
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-icons text-3xl text-gray-300 mb-2">event_available</span>
                      <h3 className="text-lg font-medium text-gray-700">No upcoming maintenance</h3>
                      <p className="text-gray-500 mt-1">This vehicle doesn't have any upcoming maintenance tasks.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {maintenanceLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="h-20 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : vehicleMaintenance && vehicleMaintenance.filter(m => m.status === "completed").length > 0 ? (
                  <div className="divide-y">
                    {vehicleMaintenance
                      .filter(m => m.status === "completed")
                      .sort((a, b) => new Date(b.completedDate || b.dueDate).getTime() - new Date(a.completedDate || a.dueDate).getTime())
                      .map(task => (
                        <div key={task.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start">
                            <div className="w-10 h-10 rounded-full bg-green-500 bg-opacity-10 text-green-500 flex items-center justify-center mr-4">
                              <span className="material-icons">check_circle</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{task.description}</h3>
                                  <p className="text-sm text-gray-500 mt-1">{task.notes || "No additional notes"}</p>
                                </div>
                                <div className="mt-2 md:mt-0">
                                  <span className="text-sm text-gray-500">
                                    Completed on {format(new Date(task.completedDate || task.dueDate), "MMM dd, yyyy")}
                                  </span>
                                </div>
                              </div>
                              
                              {task.partsUsed && task.partsUsed.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium text-gray-700">Parts Used:</span>
                                  <div className="text-sm text-gray-500">
                                    {/* This would display parts used if available */}
                                    Parts information would be shown here
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-icons text-3xl text-gray-300 mb-2">history</span>
                      <h3 className="text-lg font-medium text-gray-700">No completed maintenance</h3>
                      <p className="text-gray-500 mt-1">This vehicle doesn't have any completed maintenance records.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="all">
                {maintenanceLoading ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="h-20 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : vehicleMaintenance && vehicleMaintenance.length > 0 ? (
                  <div className="divide-y">
                    {vehicleMaintenance
                      .sort((a, b) => {
                        // Sort by status first (overdue first, then pending, then completed)
                        const statusOrder = { "overdue": 0, "pending": 1, "scheduled": 2, "completed": 3 };
                        const statusDiff = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
                        if (statusDiff !== 0) return statusDiff;
                        
                        // Then sort by date
                        const aDate = a.status === "completed" ? (a.completedDate || a.dueDate) : a.dueDate;
                        const bDate = b.status === "completed" ? (b.completedDate || b.dueDate) : b.dueDate;
                        return new Date(aDate).getTime() - new Date(bDate).getTime();
                      })
                      .map(task => {
                        const isOverdue = task.status !== "completed" && isAfter(new Date(), new Date(task.dueDate));
                        
                        return (
                          <div key={task.id} className="py-4 first:pt-0 last:pb-0">
                            <div className="flex items-start">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                                task.status === "completed"
                                  ? "bg-green-500 bg-opacity-10 text-green-500"
                                  : isOverdue
                                    ? "bg-red-500 bg-opacity-10 text-red-500"
                                    : "bg-blue-500 bg-opacity-10 text-blue-500"
                              }`}>
                                <span className="material-icons">
                                  {task.status === "completed" 
                                    ? "check_circle" 
                                    : isOverdue 
                                      ? "warning" 
                                      : "build"}
                                </span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                                  <div>
                                    <h3 className="font-medium text-gray-900">{task.description}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{task.notes || "No additional notes"}</p>
                                  </div>
                                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                                    {getPriorityBadge(task.priority)}
                                    <span className={`text-sm font-medium ${
                                      task.status === "completed"
                                        ? "text-gray-500"
                                        : isOverdue
                                          ? "text-red-500"
                                          : "text-blue-500"
                                    }`}>
                                      {task.status === "completed"
                                        ? `Completed on ${format(new Date(task.completedDate || task.dueDate), "MMM dd, yyyy")}`
                                        : formatDueDate(task.dueDate)}
                                    </span>
                                  </div>
                                </div>
                                
                                {task.status !== "completed" && (
                                  <div className="mt-3 flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <span className="material-icons text-sm mr-1">check</span>
                                      Mark Complete
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <span className="material-icons text-sm mr-1">visibility</span>
                                      View Details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-icons text-3xl text-gray-300 mb-2">build</span>
                      <h3 className="text-lg font-medium text-gray-700">No maintenance records</h3>
                      <p className="text-gray-500 mt-1">This vehicle doesn't have any maintenance records.</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
