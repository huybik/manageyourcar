/* /client/src/pages/company/orders.tsx */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, Part, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface CreateOrderFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  parts: Part[];
  users: User[];
}

function CreateOrderForm({
  onCancel,
  onSuccess,
  parts,
  users,
}: CreateOrderFormProps) {
  const { t } = useTranslation();
  const [supplier, setSupplier] = useState("");
  const [selectedParts, setSelectedParts] = useState<
    Array<{ partId: number; quantity: number; price: number }>
  >([]);
  const [selectedPartId, setSelectedPartId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onSuccess();
      toast({
        title: t("orders.orderCreatedTitle"),
        description: t("orders.orderCreatedDesc", {
          orderNumber: data.orderNumber,
        }),
      });
    },
    onError: (error) => {
      toast({
        title: t("orders.orderFailedTitle"),
        description:
          error instanceof Error ? error.message : t("orders.errorOccurred"),
        variant: "destructive",
      });
    },
  });

  const addPartToOrder = () => {
    if (selectedPartId === "" || quantity <= 0) return;

    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;

    setSelectedParts([
      ...selectedParts,
      {
        partId: part.id,
        quantity,
        price: part.price,
      },
    ]);

    setSelectedPartId("");
    setQuantity(1);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedParts.length === 0) {
      toast({
        title: t("orders.emptyOrderError"),
        description: t("orders.emptyOrderDesc"),
        variant: "destructive",
      });
      return;
    }

    const totalAmount = selectedParts.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const orderData = {
      status: "pending",
      createdDate: new Date(),
      createdBy: users[0]?.id, // current user
      supplier,
      totalAmount,
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("orders.supplierLabel")}
        </label>
        <Input
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder={t("orders.supplierPlaceholder")}
          required
        />
      </div>

      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("orders.selectPartLabel")}
          </label>
          <Select
            value={selectedPartId.toString()}
            onValueChange={(value) => setSelectedPartId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("orders.selectPartPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.id} value={part.id.toString()}>
                  {part.name} (${part.price.toFixed(2)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("orders.quantityLabel")}
          </label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
        </div>

        <div className="col-span-3 flex items-end">
          <Button
            type="button"
            onClick={addPartToOrder}
            disabled={selectedPartId === "" || quantity <= 0}
            className="w-full"
          >
            {t("orders.add")}
          </Button>
        </div>
      </div>

      {/* Selected Parts Table */}
      {selectedParts.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("orders.part")}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("orders.quantity")}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("orders.price")}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("orders.total")}
                </th>
                <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedParts.map((item, index) => {
                const part = parts.find((p) => p.id === item.partId);
                return (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {part?.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      ${item.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button
                        type="button"
                        onClick={() => removePart(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td
                  colSpan={3}
                  className="px-4 py-2 text-sm font-medium text-right"
                >
                  {t("orders.total")}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  $
                  {selectedParts
                    .reduce((sum, item) => sum + item.quantity * item.price, 0)
                    .toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("orders.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={selectedParts.length === 0 || createOrderMutation.isPending}
        >
          {createOrderMutation.isPending && (
            <span
              className="material-icons animate-spin mr-2"
              style={{ fontSize: "18px" }}
            >
              refresh
            </span>
          )}
          {t("orders.submitCreate")}
        </Button>
      </div>
    </form>
  );
}

export default function OrdersPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: parts } = useQuery<Part[]>({
    queryKey: ["/api/parts"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Function to filter orders based on search term and status filter
  const filteredOrders = orders?.filter((order) => {
    // Search filter
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateOrder = () => {
    setIsCreateOrderOpen(true);
  };

  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500 bg-opacity-10 text-blue-500";
      case "approved":
        return "bg-purple-500 bg-opacity-10 text-purple-500";
      case "ordered":
        return "bg-amber-500 bg-opacity-10 text-amber-500";
      case "received":
        return "bg-green-500 bg-opacity-10 text-green-500";
      case "cancelled":
        return "bg-red-500 bg-opacity-10 text-red-500";
      default:
        return "bg-gray-500 bg-opacity-10 text-gray-500";
    }
  };

  // Function to format date
  const formatDate = (date: Date | null) => {
    if (!date) return t("orders.na");
    return format(new Date(date), "MMM dd, yyyy");
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("orders.title")}
          </h1>
          <p className="text-gray-500">{t("orders.description")}</p>
        </div>
        <Button onClick={handleCreateOrder}>
          <span className="material-icons text-sm mr-1">add</span>
          {t("orders.createNewOrder")}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          className="w-full md:w-80"
          placeholder={t("orders.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<span className="material-icons text-gray-400">search</span>}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder={t("orders.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("orders.allOrders")}</SelectItem>
            <SelectItem value="pending">{t("orders.pending")}</SelectItem>
            <SelectItem value="approved">{t("orders.approved")}</SelectItem>
            <SelectItem value="ordered">{t("orders.ordered")}</SelectItem>
            <SelectItem value="received">{t("orders.received")}</SelectItem>
            <SelectItem value="cancelled">{t("orders.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">{t("orders.orderNumber")}</th>
                <th className="px-6 py-3">{t("orders.dateCreated")}</th>
                <th className="px-6 py-3">{t("orders.supplier")}</th>
                <th className="px-6 py-3">{t("orders.totalAmount")}</th>
                <th className="px-6 py-3">{t("orders.status")}</th>
                <th className="px-6 py-3">{t("orders.actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
              ) : filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.supplier || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.totalAmount
                          ? `$${order.totalAmount.toFixed(2)}`
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button className="text-primary font-medium">View</button>
                      <button className="text-gray-400">Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {searchTerm || statusFilter !== "all"
                      ? "No orders matching your search criteria"
                      : "No orders available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Dialog */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          <CreateOrderForm
            parts={parts || []}
            users={users || []}
            onCancel={() => setIsCreateOrderOpen(false)}
            onSuccess={() => setIsCreateOrderOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
