"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
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
  Trash2,
  MapPin,
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
  order_items?: any[];
  shipping_address: any;
  shipping_method_id: string;
  shipping_method?: any;
  payment_method_id: string;
  payment_method?: any;
  coupon_code?: string;
  notes?: string;
  newsletter_consent: boolean;
  rgpd_consent: boolean;
  is_open_package: boolean;
  open_package?: {
    id: string;
    status: string;
    user_id: string;
  } | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  open_package: "Colis ouvert",
  processing: "En cours",
  shipped: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "En attente",
  pending_transfer: "En attente de virement",
  processing: "En cours",
  completed: "Payée",
  paid: "Payée",
  succeeded: "Payée", // Ajout de variantes possibles pour Stripe
  failed: "Échouée",
  cancelled: "Annulée",
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
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const shippingMethodIds = Array.from(new Set(ordersData?.map(o => o.shipping_method_id).filter(Boolean))) as string[];
      const paymentMethodIds = Array.from(new Set(ordersData?.map(o => o.payment_method_id).filter(Boolean))) as string[];

      const [shippingMethodsRes, paymentMethodsRes] = await Promise.all([
        shippingMethodIds.length > 0
          ? supabase.from("shipping_methods").select("*").in("id", shippingMethodIds)
          : Promise.resolve({ data: [] }),
        paymentMethodIds.length > 0
          ? supabase.from("payment_methods").select("*").in("id", paymentMethodIds)
          : Promise.resolve({ data: [] })
      ]);

      const openPackageOrders = ordersData?.filter(o => o.is_open_package) || [];
      const openPackageInfoMap = new Map();

      if (openPackageOrders.length > 0) {
        const { data: packageOrdersData } = await supabase
          .from("open_package_orders")
          .select("order_id, open_package_id")
          .in("order_id", openPackageOrders.map(o => o.id));

        if (packageOrdersData && packageOrdersData.length > 0) {
          const packageIds = packageOrdersData.map(po => po.open_package_id);
          const { data: packagesData } = await supabase
            .from("open_packages")
            .select("id, status, user_id")
            .in("id", packageIds);

          if (packagesData) {
            const packagesMap = new Map(packagesData.map(p => [p.id, p]));
            packageOrdersData.forEach(po => {
              const pkg = packagesMap.get(po.open_package_id);
              if (pkg) openPackageInfoMap.set(po.order_id, pkg);
            });
          }
        }
      }

      const shippingMethodsMap = new Map(shippingMethodsRes.data?.map(m => [m.id, m]));
      const paymentMethodsMap = new Map(paymentMethodsRes.data?.map(m => [m.id, m]));

      const enrichedOrders = ordersData?.map(order => ({
        ...order,
        shipping_method: order.shipping_method_id ? shippingMethodsMap.get(order.shipping_method_id) : null,
        payment_method: order.payment_method_id ? paymentMethodsMap.get(order.payment_method_id) : null,
        open_package: openPackageInfoMap.get(order.id) || null
      })) || [];

      setOrders(enrichedOrders);
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
    const order = orders.find(o => o.id === orderId);

    // SÉCURITÉ COLIS OUVERT (Réactivée mais flexible si besoin)
    if (order?.open_package && (order.open_package.status === 'active' || order.open_package.status === 'ready_to_prepare')) {
      if (newStatus === 'shipped') {
        toast.error("❌ Impossible : Cette commande appartient à un Colis Ouvert non clôturé.");
        return;
      }
    }

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

      const label = statusLabels[newStatus] || newStatus;
      toast.success(`Statut mis à jour : ${label}`);
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

      const label = paymentStatusLabels[newStatus] || newStatus;
      toast.success(`Paiement mis à jour : ${label}`);
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      open_package: "secondary",
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
      pending_transfer: "secondary",
      processing: "default",
      completed: "default",
      paid: "default",
      succeeded: "default",
      failed: "destructive",
      cancelled: "destructive",
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

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer la commande #${orderNumber} ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Commande supprimée avec succès");
      if (selectedOrder && selectedOrder.id === orderId) {
        setDialogOpen(false);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleGeneratePDF = async (orderId: string, orderNumber: string) => {
    toast.loading("Génération du PDF en cours...");
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Commande introuvable");

      const orderForPdf = {
        ...order,
        items: order.order_items || order.items || [],
        payment_method: order.payment_method?.name || order.payment_method_id || 'CB / Stripe'
      };

      const doc = await generateInvoicePDF(orderForPdf, orderNumber);
      doc.save(`Facture_${orderNumber}.pdf`);

      toast.dismiss();
      toast.success("PDF téléchargé avec succès");
    } catch (error: any) {
      toast.dismiss();
      console.error("Error generating PDF:", error);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  const handleSendEmail = async (orderId: string, orderNumber: string) => {
    toast.loading("Envoi de l'email...");

    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) throw new Error("Commande introuvable");

      const orderForPdf = {
        ...order,
        items: order.order_items || order.items || [],
        payment_method: order.payment_method?.name || "CB / Stripe",
      };

      const doc = await generateInvoicePDF(orderForPdf, orderNumber);
      const pdfBlob = doc.output("blob");

      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result?.toString().split(",")[1];
          if (res) resolve(res);
          else reject(new Error("Echec de la conversion du PDF"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const emailResponse = await fetch("/api/orders/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          pdfBase64: base64data,
          filename: `Facture_${orderNumber}.pdf`,
        }),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(emailData.error || "Erreur lors de l'envoi de l'email");
      }

      toast.dismiss();
      toast.success("Email envoyé avec succès !");
    } catch (error: any) {
      toast.dismiss();
      console.error("Error sending email:", error);
      toast.error(`Erreur: ${error.message}`);
    }
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
              <SelectContent className="z-[9999] bg-white">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En cours</SelectItem>
                <SelectItem value="shipped">En livraison</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="refunded">Remboursée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut paiement" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white">
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
                          {order.is_open_package && order.open_package && (
                            <Badge
                              className={
                                order.open_package.status === 'active' || order.open_package.status === 'ready_to_prepare'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }
                              title={`Colis ouvert - Statut: ${order.open_package.status}`}
                            >
                              📦 Colis Ouvert
                            </Badge>
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
                        {(Number(order.total) || 0).toFixed(2)} €
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
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGeneratePDF(order.id, order.order_number)}
                            className="hover:bg-green-50 hover:text-green-600"
                            title="Télécharger le PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendEmail(order.id, order.order_number)}
                            className="hover:bg-purple-50 hover:text-purple-600"
                            title="Envoyer par email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="hover:bg-red-50 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
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
                      {/* AJOUT DE Z-INDEX POUR FORCER L'AFFICHAGE AU DESSUS DU DIALOG */}
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white">
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="open_package">Colis ouvert</SelectItem>
                          <SelectItem value="processing">En cours</SelectItem>
                          <SelectItem value="shipped">En livraison</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Statut paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* AJOUT DE Z-INDEX POUR FORCER L'AFFICHAGE AU DESSUS DU DIALOG */}
                      <Select
                        value={selectedOrder.payment_status}
                        onValueChange={(value) =>
                          handleUpdatePaymentStatus(selectedOrder.id, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white">
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="pending_transfer">En attente de virement</SelectItem>
                          <SelectItem value="completed">Payée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                          <SelectItem value="failed">Échouée (Système)</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#D4AF37]" />
                      Adresse de livraison
                    </h3>
                    {selectedOrder.shipping_address ? (
                      <div className="bg-gray-50 p-4 rounded-lg text-sm">
                        <p className="font-medium">
                          {selectedOrder.shipping_address.first_name}{" "}
                          {selectedOrder.shipping_address.last_name}
                        </p>
                        <p>{(selectedOrder as any).shipping_street || selectedOrder.shipping_address.address_line1 || selectedOrder.shipping_address.street}</p>
                        {selectedOrder.shipping_address.address_line2 && (
                          <p>{selectedOrder.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {selectedOrder.shipping_address.postal_code}{" "}
                          {selectedOrder.shipping_address.city}
                        </p>
                        <p>{selectedOrder.shipping_address.country}</p>
                        <p className="mt-2">Tél: {(selectedOrder as any).shipping_phone || selectedOrder.shipping_address.phone}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Adresse non disponible</p>
                    )}
                  </div>

                  {selectedOrder.shipping_method && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[#D4AF37]" />
                        Mode de livraison
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm">
                        <p className="font-medium">{selectedOrder.shipping_method.name}</p>
                        <p className="text-gray-600 mt-1">{selectedOrder.shipping_method.description}</p>
                        {selectedOrder.shipping_method.delivery_time && (
                          <p className="text-gray-600 mt-1">
                            Délai: {selectedOrder.shipping_method.delivery_time}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#D4AF37]" />
                    Produits commandés ({selectedOrder.order_items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex gap-4 bg-gray-50 p-4 rounded-lg border"
                        >
                          {item.product_image && (
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            {item.variation_data && (
                              <div className="text-sm text-gray-600 mt-1">
                                {(() => {
                                  const attributes = item.variation_data.attributes || item.variation_data;
                                  if (Array.isArray(attributes)) {
                                    return attributes.map((attr: any, idx: number) => (
                                      <span key={idx} className="mr-3">
                                        {attr.name}: <strong>{attr.option}</strong>
                                      </span>
                                    ));
                                  }
                                  if (typeof attributes === 'object') {
                                    return Object.entries(attributes).map(([key, value]) => {
                                      if (key === 'price' || key === 'image' || key.includes('_id') || key.includes('color_code')) return null;
                                      const displayValue = typeof value === 'object'
                                        ? (value as any)?.name || (value as any)?.option || String(value)
                                        : String(value);
                                      return (
                                        <span key={key} className="mr-3">
                                          {key}: <strong>{displayValue}</strong>
                                        </span>
                                      );
                                    }).filter(Boolean);
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                              <p className="font-semibold">
                                {((Number(item.price) || 0) * item.quantity).toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Aucun produit trouvé</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Récapitulatif financier</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{(Number(selectedOrder.subtotal) || 0).toFixed(2)} €</span>
                    </div>
                    {(Number(selectedOrder.shipping_cost) || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Frais de port</span>
                        <span>{(Number(selectedOrder.shipping_cost) || 0).toFixed(2)} €</span>
                      </div>
                    )}
                    {(Number(selectedOrder.discount_amount) || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Remise {selectedOrder.coupon_code && `(${selectedOrder.coupon_code})`}
                        </span>
                        <span>-{(Number(selectedOrder.discount_amount) || 0).toFixed(2)} €</span>
                      </div>
                    )}
                    {Number(selectedOrder.wallet_amount_used) > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Portefeuille utilisé</span>
                        <span>-{(Number(selectedOrder.wallet_amount_used) || 0).toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>TVA (20%)</span>
                      <span>{(Number(selectedOrder.tax_amount) || 0).toFixed(2)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg text-[#D4AF37]">
                      <span>Total TTC</span>
                      <span>{(Number(selectedOrder.total) || 0).toFixed(2)} €</span>
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