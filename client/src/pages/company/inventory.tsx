/* /client/src/pages/company/inventory.tsx */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Part, insertPartSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import InventoryList from "@/components/inventory/inventory-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

type PartFormValues = z.infer<typeof insertPartSchema>;

function PartForm({
  onCancel,
  onSuccess,
  existingPart,
}: {
  onCancel: () => void;
  onSuccess: () => void;
  existingPart?: Part;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch standard parts for the dropdown
  const { data: standardParts } = useQuery<Part[]>({
    queryKey: ["/api/parts/standard"],
  });

  const form = useForm<PartFormValues>({
    resolver: zodResolver(insertPartSchema),
    defaultValues: {
      name: existingPart?.name || "",
      sku: existingPart?.sku || "",
      description: existingPart?.description || "",
      category: existingPart?.category || "",
      price: existingPart?.price || 0,
      quantity: existingPart?.quantity || 0,
      minimumStock: existingPart?.minimumStock || 10,
      supplier: existingPart?.supplier || "",
      location: existingPart?.location || "",
      maintenanceIntervalDays: existingPart?.maintenanceIntervalDays || null,
      maintenanceIntervalMileage:
        existingPart?.maintenanceIntervalMileage || null,
      icon: existingPart?.icon || null, // Add icon default
      isStandard: existingPart?.isStandard ?? false, // Default to false for new custom parts
      // compatibleVehicles: existingPart?.compatibleVehicles || [], // Handle JSON later if needed
    },
  });

  const handleStandardPartSelect = (partId: string) => {
    const selectedPart = standardParts?.find((p) => p.id === parseInt(partId));
    if (selectedPart) {
      // Pre-fill form, but allow user to override quantity, location, etc.
      // Keep SKU unique by appending something or clearing it
      form.reset({
        name: selectedPart.name,
        sku: "", // Clear SKU or suggest a new one
        description: selectedPart.description || "",
        category: selectedPart.category,
        price: selectedPart.price,
        quantity: 0, // Start with 0 quantity for the new inventory item
        minimumStock: selectedPart.minimumStock || 10,
        supplier: selectedPart.supplier || "",
        location: "", // Let user specify location
        maintenanceIntervalDays: selectedPart.maintenanceIntervalDays || null,
        maintenanceIntervalMileage:
          selectedPart.maintenanceIntervalMileage || null,
        icon: selectedPart.icon || null,
        isStandard: false, // This is now a custom instance based on a standard part
      });
      toast({
        title: t("inventory.standardPartSelected"),
        description: t("inventory.standardPartSelectedDesc"),
      });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: PartFormValues) => {
      const method = existingPart ? "PUT" : "POST";
      const url = existingPart ? `/api/parts/${existingPart.id}` : "/api/parts";
      // Ensure isStandard is false when creating a new part from standard selection
      const payload = {
        ...data,
        isStandard: existingPart?.isStandard ?? false,
      };
      const response = await apiRequest(method, url, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts/standard"] }); // Invalidate standard parts too
      toast({
        title: existingPart
          ? t("inventory.partUpdatedTitle")
          : t("inventory.partAddedTitle"),
        description: existingPart
          ? t("inventory.partUpdatedDesc")
          : t("inventory.partAddedDesc"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: existingPart
          ? t("inventory.partUpdateFailedTitle")
          : t("inventory.partAddFailedTitle"),
        description:
          error instanceof Error ? error.message : t("inventory.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PartFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Standard Part Selection (only for new parts) */}
        {!existingPart && standardParts && standardParts.length > 0 && (
          <FormItem>
            <FormLabel>{t("inventory.selectStandardPart")}</FormLabel>
            <Select onValueChange={handleStandardPartSelect}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("inventory.selectStandardPartPlaceholder")}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {standardParts.map((part) => (
                  <SelectItem key={part.id} value={part.id.toString()}>
                    <div className="flex items-center">
                      {part.icon && (
                        <span className="material-icons mr-2 text-sm">
                          {part.icon}
                        </span>
                      )}
                      {part.name} ({part.sku})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t("inventory.selectStandardPartDesc")}
            </p>
          </FormItem>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.partName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("inventory.partNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.sku")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("inventory.skuPlaceholder")}
                    {...field}
                  />
                </FormControl>
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
              <FormLabel>{t("inventory.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("inventory.descriptionPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.category")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("inventory.categoryPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.price")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.quantity")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
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
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.minimumStock")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10"
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
            name="maintenanceIntervalDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.intervalDays")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("inventory.intervalDaysPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maintenanceIntervalMileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.intervalMileage")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("inventory.intervalMileagePlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
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
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.supplier")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("inventory.supplierPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.location")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("inventory.locationPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("inventory.iconLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("inventory.iconPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                {t("inventory.iconDesc")}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("inventory.cancel")}
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <span className="material-icons animate-spin mr-2 text-sm">
                refresh
              </span>
            )}
            {existingPart ? t("inventory.updatePart") : t("inventory.addPart")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function InventoryPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | undefined>(undefined);

  const handleAddPart = () => {
    setEditingPart(undefined);
    setIsFormOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPart(undefined);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("inventory.title")}
          </h1>
          <p className="text-gray-500">{t("inventory.description")}</p>
        </div>
        <Button onClick={handleAddPart}>
          <span className="material-icons text-sm mr-1">add</span>
          {t("inventory.addNewPart")}
        </Button>
      </div>

      {/* Content */}
      {/* Pass handleEditPart to InventoryList */}
      <InventoryList onEditPart={handleEditPart} onAddPart={handleAddPart} />

      {/* Add/Edit Part Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPart
                ? t("inventory.editPartTitle")
                : t("inventory.addPartTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingPart
                ? t("inventory.editPartDesc")
                : t("inventory.addPartDesc")}
            </DialogDescription>
          </DialogHeader>
          <PartForm
            onCancel={handleFormClose}
            onSuccess={handleFormClose}
            existingPart={editingPart}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
