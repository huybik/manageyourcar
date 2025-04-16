import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function VehiclesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });
  
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter vehicles based on search term
  const filteredVehicles = vehicles?.filter(vehicle => 
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Function to get vehicle status badge color
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
  
  // Function to get vehicle icon based on type
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "truck":
        return "local_shipping";
      case "van":
        return "airport_shuttle";
      default:
        return "directions_car";
    }
  };
  
  // Function to get driver name
  const getDriverName = (userId: number | null | undefined) => {
    if (!userId) return "Unassigned";
    const driver = users?.find(user => user.id === userId);
    return driver ? driver.name : "Unknown";
  };
  
  // Function to format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not scheduled";
    return format(new Date(date), "MMM dd, yyyy");
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
          <p className="text-gray-500">Track and manage your fleet vehicles</p>
        </div>
        <Button className="md:w-auto">
          <span className="material-icons text-sm mr-1">add</span>
          Add New Vehicle
        </Button>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <Input
          className="w-full md:w-80"
          placeholder="Search by name, VIN, make or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />
      </div>
      
      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Make/Model</th>
                <th className="px-6 py-3">Assigned To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Next Maintenance</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehiclesLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : filteredVehicles && filteredVehicles.length > 0 ? (
                filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="material-icons text-gray-500">{getVehicleIcon(vehicle.type)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                          <div className="text-xs text-gray-500">VIN: {vehicle.vin}</div>
                          {vehicle.licensePlate && (
                            <div className="text-xs text-gray-500">License: {vehicle.licensePlate}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.make} {vehicle.model}</div>
                      <div className="text-xs text-gray-500">{vehicle.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getDriverName(vehicle.assignedTo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                        {vehicle.status.replace("_", " ").charAt(0).toUpperCase() + vehicle.status.replace("_", " ").slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(vehicle.nextMaintenanceDate)}</div>
                      {vehicle.nextMaintenanceMileage && (
                        <div className="text-xs text-gray-500">or at {vehicle.nextMaintenanceMileage.toLocaleString()} miles</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button className="text-primary font-medium">Edit</button>
                      <button className="text-gray-400">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'No vehicles matching your search criteria' : 'No vehicles available'}
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
