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
      maintenanceIntervalDays: existingPart?.maintenanceIntervalDays || undefined,
      maintenanceIntervalMileage: existingPart?.maintenanceIntervalMileage || undefined,
      // compatibleVehicles: existingPart?.compatibleVehicles || [], // Handle JSON later if needed
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PartFormValues) => {
      const method = existingPart ? "PUT" : "POST";
      const url = existingPart ? `/api/parts/${existingPart.id}` : "/api/parts";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts/low-stock"] });
      toast({
        title: existingPart ? t("inventory.partUpdatedTitle") : t("inventory.partAddedTitle"),
        description: existingPart ? t("inventory.partUpdatedDesc") : t("inventory.partAddedDesc"),
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: existingPart ? t("inventory.partUpdateFailedTitle") : t("inventory.partAddFailedTitle"),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("inventory.partName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("inventory.partNamePlaceholder")} {...field} />
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
                  <Input placeholder={t("inventory.skuPlaceholder")} {...field} />
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
                <Textarea placeholder={t("inventory.descriptionPlaceholder")} {...field} />
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
                  <Input placeholder={t("inventory.categoryPlaceholder")} {...field} />
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
                  <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                  <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                  <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                  <Input type="number" placeholder={t("inventory.intervalDaysPlaceholder")} {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
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
                  <Input type="number" placeholder={t("inventory.intervalMileagePlaceholder")} {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} />
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
                  <Input placeholder={t("inventory.supplierPlaceholder")} {...field} />
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
                  <Input placeholder={t("inventory.locationPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            <DialogTitle>{editingPart ? t("inventory.editPartTitle") : t("inventory.addPartTitle")}</DialogTitle>
            <DialogDescription>
              {editingPart ? t("inventory.editPartDesc") : t("inventory.addPartDesc")}
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
