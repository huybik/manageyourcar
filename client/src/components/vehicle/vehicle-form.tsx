/* /client/src/components/vehicle/vehicle-form.tsx */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

// Extend the vehicle schema to add validation
const vehicleFormSchema = insertVehicleSchema.extend({
  nextMaintenanceDate: z.date().optional().nullable(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  users: User[];
  existingVehicle?: Vehicle;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function VehicleForm({
  users,
  existingVehicle,
  onCancel,
  onSuccess,
}: VehicleFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const drivers = users.filter((user) => user.role === "driver");

  // Set up default values
  const defaultValues: Partial<VehicleFormValues> = {
    name: existingVehicle?.name || "",
    type: existingVehicle?.type || "sedan",
    vin: existingVehicle?.vin || "",
    licensePlate: existingVehicle?.licensePlate || "",
    make: existingVehicle?.make || "",
    model: existingVehicle?.model || "",
    year: existingVehicle?.year || new Date().getFullYear(),
    mileage: existingVehicle?.mileage || 0,
    assignedTo: existingVehicle?.assignedTo || undefined,
    status: existingVehicle?.status || "active",
    nextMaintenanceDate: existingVehicle?.nextMaintenanceDate
      ? new Date(existingVehicle.nextMaintenanceDate)
      : null,
    nextMaintenanceMileage:
      existingVehicle?.nextMaintenanceMileage || undefined,
  };

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("vehicles.vehicleCreatedTitle"),
        description: t("vehicles.vehicleCreatedDesc"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t("vehicles.vehicleFailedCreate"),
        description:
          error instanceof Error ? error.message : t("vehicles.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      if (!existingVehicle) throw new Error("No vehicle to update");
      const response = await apiRequest(
        "PUT",
        `/api/vehicles/${existingVehicle.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: t("vehicles.vehicleUpdatedTitle"),
        description: t("vehicles.vehicleUpdatedDesc"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t("vehicles.vehicleFailedUpdate"),
        description:
          error instanceof Error ? error.message : t("vehicles.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    if (existingVehicle) {
      updateVehicleMutation.mutate(data);
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  const isPending =
    createVehicleMutation.isPending || updateVehicleMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.vehicleNameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("vehicles.vehicleNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.vehicleTypeLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("vehicles.selectType")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sedan">{t("vehicles.sedan")}</SelectItem>
                    <SelectItem value="suv">{t("vehicles.suv")}</SelectItem>
                    <SelectItem value="truck">{t("vehicles.truck")}</SelectItem>
                    <SelectItem value="van">{t("vehicles.van")}</SelectItem>
                    <SelectItem value="other">{t("vehicles.other")}</SelectItem>
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
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.makeLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("vehicles.makePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.modelLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("vehicles.modelPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.yearLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("vehicles.yearPlaceholder")}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.mileageLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("vehicles.mileagePlaceholder")}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.vinLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("vehicles.vinPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.licensePlateLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("vehicles.licensePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.assignDriverLabel")}</FormLabel>
                <Select
                  // Use undefined for the Select's value when field.value is undefined/null
                  value={field.value?.toString() ?? "none"}
                  onValueChange={(value) =>
                    // Convert "none" back to undefined for the form state
                    field.onChange(
                      value === "none" ? undefined : parseInt(value)
                    )
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("vehicles.selectDriverPlaceholder")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Use a non-empty string for the "Unassigned" option's value */}
                    <SelectItem value="none">
                      {t("vehicles.unassigned")}
                    </SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.name}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.statusLabel")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("vehicles.selectStatus")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">
                      {t("vehicles.active")}
                    </SelectItem>
                    <SelectItem value="maintenance">
                      {t("vehicles.maintenance")}
                    </SelectItem>
                    <SelectItem value="out_of_service">
                      {t("vehicles.outOfService")}
                    </SelectItem>
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
            name="nextMaintenanceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("vehicles.nextMaintDateLabel")}</FormLabel>
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
                          <span>{t("vehicles.pickDateOptional")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={(date) => field.onChange(date)}
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
            name="nextMaintenanceMileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("vehicles.nextMaintMileageLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("vehicles.nextMaintMileagePlaceholder")}
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("vehicles.cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <span className="material-icons animate-spin mr-2 text-sm">
                refresh
              </span>
            )}
            {existingVehicle
              ? t("vehicles.updateVehicle")
              : t("vehicles.addVehicle")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
