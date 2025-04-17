/* /client/src/components/maintenance/maintenance-form.tsx */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMaintenanceSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import { type Vehicle, type User } from "@shared/schema";
import { useTranslation } from "react-i18next";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Extend the maintenance schema to add validation
const maintenanceFormSchema = insertMaintenanceSchema.extend({
  dueDate: z.date({
    required_error: "Due date is required",
  }),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  vehicles: Vehicle[];
  users: User[];
  onCancel: () => void;
  onSuccess: () => void;
}

export default function MaintenanceForm({
  vehicles,
  users,
  onCancel,
  onSuccess,
}: MaintenanceFormProps) {
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      vehicleId: undefined,
      type: "",
      description: "",
      dueDate: new Date(),
      status: "pending",
      priority: "normal",
      assignedTo: undefined,
      notes: "",
      partsUsed: [],
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      // Ensure dueDate is sent in ISO format
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString(),
      };

      console.log("Submitting maintenance data:", formattedData);
      const response = await apiRequest(
        "POST",
        "/api/maintenance",
        formattedData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/pending"] });
      toast({
        title: t("maintenance.taskCreatedTitle"),
        description: t("maintenance.taskCreatedDesc"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t("maintenance.taskFailedTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("maintenance.taskFailedDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaintenanceFormValues) => {
    logger.logFormSubmission("MaintenanceForm", true, {
      vehicleId: data.vehicleId,
      type: data.type,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate.toISOString(),
    });
    createMaintenanceMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.vehicle")}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("maintenance.selectVehicle")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem
                        key={vehicle.id}
                        value={vehicle.id.toString()}
                      >
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
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.assignTo")}</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("maintenance.selectDriver")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.maintenanceType")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("maintenance.selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="oil_change">
                      {t("maintenance.oilChange")}
                    </SelectItem>
                    <SelectItem value="brake_inspection">
                      {t("maintenance.brakeInspection")}
                    </SelectItem>
                    <SelectItem value="tire_rotation">
                      {t("maintenance.tireRotation")}
                    </SelectItem>
                    <SelectItem value="engine_tuneup">
                      {t("maintenance.engineTuneup")}
                    </SelectItem>
                    <SelectItem value="filter_replacement">
                      {t("maintenance.filterReplacement")}
                    </SelectItem>
                    <SelectItem value="battery_replacement">
                      {t("maintenance.batteryReplacement")}
                    </SelectItem>
                    <SelectItem value="other">
                      {t("maintenance.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maintenance.priority")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("maintenance.selectPriority")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">{t("maintenance.low")}</SelectItem>
                    <SelectItem value="normal">
                      {t("maintenance.normal")}
                    </SelectItem>
                    <SelectItem value="high">
                      {t("maintenance.high")}
                    </SelectItem>
                    <SelectItem value="critical">
                      {t("maintenance.critical")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.descriptionLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("maintenance.descriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("maintenance.dueDateLabel")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t("maintenance.pickDate")}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("maintenance.notesLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("maintenance.notesPlaceholder")}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logger.logButtonClick("Cancel", "MaintenanceForm");
              onCancel();
            }}
          >
            {t("maintenance.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createMaintenanceMutation.isPending}
            onClick={() => {
              logger.logButtonClick("Schedule Maintenance", "MaintenanceForm");
            }}
          >
            {createMaintenanceMutation.isPending && (
              <span className="material-icons animate-spin mr-2 text-sm">
                refresh
              </span>
            )}
            {t("maintenance.submitSchedule")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
