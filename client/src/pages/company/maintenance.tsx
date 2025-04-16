import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Maintenance, Vehicle, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MaintenanceList from "@/components/maintenance/maintenance-list";
import MaintenanceForm from "@/components/maintenance/maintenance-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MaintenancePage() {
  const { toast } = useToast();
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
    if (success) {
      toast({
        title: "Maintenance task created",
        description: "The maintenance task has been created successfully.",
      });
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance Management</h1>
          <p className="text-gray-500">Schedule and track vehicle maintenance</p>
        </div>
        <Button onClick={handleCreateMaintenance}>
          <span className="material-icons text-sm mr-1">add</span>
          Schedule Maintenance
        </Button>
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Maintenance Tasks List */}
      <MaintenanceList 
        title="Maintenance Tasks"
        viewAll={false}
        filter={statusFilter !== "all" ? statusFilter : undefined}
        showActions={true}
      />
      
      {/* Create Maintenance Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Task</DialogTitle>
          </DialogHeader>
          <MaintenanceForm 
            vehicles={vehicles || []} 
            users={users?.filter(user => user.role === "driver") || []} 
            onCancel={() => setIsFormOpen(false)}
            onSuccess={() => handleFormClose(true)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
