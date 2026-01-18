'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, Eye, Calendar, CreditCard, Truck, MapPin, Store, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// Import de la fonction sécurisée pour le PDF
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  price: string;
  quantity: number;
  variation_data: any;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  created_at: string;
  shipping_address: any;
  order_items?: OrderItem[];
  shipping_method?: any;
  payment_method?: any;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-800' },
  processing: { label: 'En préparation', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      // Récupération des commandes avec order_items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Récupération des méthodes de livraison et paiement
      const shippingMethodIds = Array.from(new Set(ordersData?.map(o => o.shipping_method_id).filter(Boolean))) as string[];
      const paymentMethodIds = Array.from(new Set(ordersData?.map(o => o.payment_method_id).filter(Boolean))) as string[];

      const [shippingMethodsRes, paymentMethodsRes] = await Promise.all([
        shippingMethodIds.length > 0
          ? supabase.from('shipping_methods').select('*').in('id', shippingMethodIds)
          : Promise.resolve({ data: [] }),
        paymentMethodIds.length > 0
          ? supabase.from('payment_methods').select('*').in('id', paymentMethodIds)
          : Promise.resolve({ data: [] })
      ]);

      // Association des données
      const shippingMethodsMap = new Map(shippingMethodsRes.data?.map(m => [m.id, m]));
      const paymentMethodsMap = new Map(paymentMethodsRes.data?.map(m => [m.id, m]));

      const enrichedOrders = ordersData?.map(order => ({
        ...order,
        shipping_method: order.shipping_method_id ? shippingMethodsMap.get(order.shipping_method_id) : null,
        payment_method: order.payment_method_id ? paymentMethodsMap.get(order.payment_method_id) : null
      })) || [];

      setOrders(enrichedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  // --- NOUVELLE FONCTION DE TÉLÉCHARGEMENT PDF (Locale et Sécurisée) ---
  const handleDownloadPDF = async (order: Order) => {
    setDownloadingPdf(true);
    toast.loading("Génération de la facture...");

    try {
      // On prépare l'objet pour le générateur PDF
      const orderForPdf = {
        ...order,
        items: order.order_items || [],
        // On récupère le NOM du moyen de paiement s'il existe, sinon fallback
        payment_method: order.payment_method?.name || 'CB / Stripe'
      };

      // Appel au générateur local (plus rapide et fiable)
      const doc = await generateInvoicePDF(orderForPdf, order.order_number);
      doc.save(`Facture_${order.order_number}.pdf`);

      toast.dismiss();
      toast.success("Facture téléchargée !");
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Mes commandes</h2>
        <p className="text-gray-600">Consultez l'historique de vos commandes</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore passé de commande</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#b8933d] to-[#d4af37] hover:from-[#9a7a2f] hover:to-[#b8933d] text-white">
                Découvrir nos produits
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Commande #{order.order_number}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(order.created_at)}
                    </CardDescription>
                  </div>
                  <Badge className={statusLabels[order.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {statusLabels[order.status]?.label || order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-lg font-semibold">
                        {(Number(order.total) || 0).toFixed(2)}€
                        </span>
                    </div>
                    {/* Affichage du moyen de paiement */}
                    <div className="text-sm text-gray-500 ml-7">
                        Via {order.payment_method?.name || 'CB / Stripe'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDownloadPDF(order)}
                        disabled={downloadingPdf}
                    >
                        {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        <span className="hidden sm:inline">Facture</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/20"
                        onClick={() => {
                        setSelectedOrder(order);
                        setDialogOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                        Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>Détails de la commande #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Commandée le {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#D4AF37]" />
                  Articles commandés ({selectedOrder.order_items?.length || 0})
                </h3>

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4 border rounded-lg p-4">
                        {item.product_image && (
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.product_name}</h4>
                          {item.variation_data && Object.keys(item.variation_data).length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              {Object.entries(item.variation_data).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: <strong>{typeof value === 'object' ? (value as any)?.name || (value as any)?.option || String(value) : String(value)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">Quantité: {item.quantity}</span>
                            <span className="font-semibold">{(Number(item.price) || 0).toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun article trouvé</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {(selectedOrder as any).relay_point_data ? (
                    <Store className="h-5 w-5 text-[#D4AF37]" />
                  ) : (
                    <MapPin className="h-5 w-5 text-[#D4AF37]" />
                  )}
                  {(selectedOrder as any).relay_point_data ? 'Point Relais' : 'Adresse de livraison'}
                </h3>
                {(selectedOrder as any).relay_point_data ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Store className="h-5 w-5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {(selectedOrder as any).relay_point_data.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {(selectedOrder as any).relay_point_data.address}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          ID: {(selectedOrder as any).relay_point_data.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedOrder.shipping_address ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">
                      {selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {(selectedOrder as any).shipping_street || selectedOrder.shipping_address.address_line1}
                    </p>
                    {selectedOrder.shipping_address.address_line2 && (
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shipping_address.address_line2}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      {selectedOrder.shipping_address.postal_code} {selectedOrder.shipping_address.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tél: {(selectedOrder as any).shipping_phone || selectedOrder.shipping_address.phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600">Adresse non disponible</p>
                )}
              </div>

              {selectedOrder.shipping_method && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-[#D4AF37]" />
                      Mode de livraison
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{selectedOrder.shipping_method.name}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.shipping_method.description}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D4AF37]" />
                  Récapitulatif
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{(Number(selectedOrder.subtotal) || 0).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{(Number(selectedOrder.shipping_cost) || 0).toFixed(2)}€</span>
                  </div>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction</span>
                      <span>-{(Number(selectedOrder.discount_amount) || 0).toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>TVA</span>
                    <span>{(Number(selectedOrder.tax_amount) || 0).toFixed(2)}€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{(Number(selectedOrder.total) || 0).toFixed(2)}€</span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Payé via {selectedOrder.payment_method?.name || 'CB / Stripe'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}