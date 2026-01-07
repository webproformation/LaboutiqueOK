"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Eye,
  Download,
  Mail,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  wallet_amount_used: number;
  total: number;
  items: any[];
  shipping_address: any;
  shipping_method_id: string;
  payment_method_id: string;
  coupon_code?: string;
  notes?: string;
  newsletter_consent: boolean;
  rgpd_consent: boolean;
  is_open_package: boolean;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Payée",
  failed: "Échouée",
  refunded: "Remboursée",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newStatus });
      }

      toast.success("Statut de paiement mis à jour");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      processing: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
      refunded: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
      refunded: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {paymentStatusLabels[status] || status}
      </Badge>
    );
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-[#D4AF37]" />
          <p className="text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#b8933d] to-[#d4af37] bg-clip-text text-transparent">
            Gestion des commandes
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {filteredOrders.length} commande(s) trouvée(s) sur {orders.length} au total
          </p>
        </div>
        <Button
          onClick={loadOrders}
          variant="outline"
          className="border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut commande" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paiements</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="completed">Payée</SelectItem>
                <SelectItem value="failed">Échouée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Les commandes apparaîtront ici"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {order.is_open_package && (
                            <div title="Colis ouvert">
                              <Package className="h-4 w-4 text-blue-500" />
                            </div>
                          )}
                          #{order.order_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                      </TableCell>
                      <TableCell className="font-semibold text-[#D4AF37]">
                        {Number(order.total).toFixed(2)} €
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  Commande #{selectedOrder.order_number}
                  {selectedOrder.is_open_package && (
                    <Badge className="bg-blue-500">Colis ouvert</Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Créée le {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(selectedOrder.created_at).toLocaleTimeString("fr-FR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Statut commande</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="processing">En cours</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                          <SelectItem value="refunded">Remboursée</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Statut paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={selectedOrder.payment_status}
                        onValueChange={(value) =>
                          handleUpdatePaymentStatus(selectedOrder.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="processing">En cours</SelectItem>
                          <SelectItem value="completed">Payée</SelectItem>
                          <SelectItem value="failed">Échouée</SelectItem>
                          <SelectItem value="refunded">Remboursée</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Adresse de livraison</h3>
                  {selectedOrder.shipping_address && (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">
                      <p className="font-medium">
                        {selectedOrder.shipping_address.first_name}{" "}
                        {selectedOrder.shipping_address.last_name}
                      </p>
                      <p>{selectedOrder.shipping_address.address_line1}</p>
                      {selectedOrder.shipping_address.address_line2 && (
                        <p>{selectedOrder.shipping_address.address_line2}</p>
                      )}
                      <p>
                        {selectedOrder.shipping_address.postal_code}{" "}
                        {selectedOrder.shipping_address.city}
                      </p>
                      <p>{selectedOrder.shipping_address.country}</p>
                      <p className="mt-2">Tél: {selectedOrder.shipping_address.phone}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Produits commandés</h3>
                  <div className="space-y-2">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-semibold">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Aucun produit</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Récapitulatif financier</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{Number(selectedOrder.subtotal).toFixed(2)} €</span>
                    </div>
                    {Number(selectedOrder.shipping_cost) > 0 && (
                      <div className="flex justify-between">
                        <span>Frais de port</span>
                        <span>{Number(selectedOrder.shipping_cost).toFixed(2)} €</span>
                      </div>
                    )}
                    {Number(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Remise {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}
                        </span>
                        <span>-{Number(selectedOrder.discount_amount).toFixed(2)} €</span>
                      </div>
                    )}
                    {Number(selectedOrder.wallet_amount_used) > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Portefeuille utilisé</span>
                        <span>-{Number(selectedOrder.wallet_amount_used).toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>TVA (20%)</span>
                      <span>{Number(selectedOrder.tax_amount).toFixed(2)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg text-[#D4AF37]">
                      <span>Total TTC</span>
                      <span>{Number(selectedOrder.total).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes client</h3>
                      <p className="bg-gray-50 p-3 rounded-lg text-sm">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
