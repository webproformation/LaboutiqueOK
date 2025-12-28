"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Loader2, FileText, Download, Gem, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { GuestbookForm } from '@/components/GuestbookForm';
import html2pdf from 'html2pdf.js';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  woocommerce_order_id: number | null;
  invoice_url: string | null;
  order_items: OrderItem[];
  has_guestbook_entry?: boolean;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  price: string;
  quantity: number;
}

interface OrderInvoice {
  id: string;
  invoice_number: string;
  pdf_url: string;
  sent_at: string | null;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);
  const [showGuestbookDialog, setShowGuestbookDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoices, setInvoices] = useState<Record<number, OrderInvoice>>({});

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersData) {
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          const { data: guestbookEntry } = await supabase
            .from('guestbook_entries')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();

          return {
            ...order,
            order_items: items || [],
            has_guestbook_entry: !!guestbookEntry,
          };
        })
      );

      setOrders(ordersWithItems);

      // Load invoices for orders with woocommerce_order_id
      loadInvoices(ordersWithItems);
    }

    setLoading(false);
  };

  const loadInvoices = async (ordersData: Order[]) => {
    try {
      const invoicesMap: Record<number, OrderInvoice> = {};

      await Promise.all(
        ordersData
          .filter((order) => order.woocommerce_order_id)
          .map(async (order) => {
            const response = await fetch(
              `/api/invoices?orderId=${order.woocommerce_order_id}`
            );
            const data = await response.json();
            if (data.invoices?.[0]) {
              invoicesMap[order.woocommerce_order_id!] = data.invoices[0];
            }
          })
      );

      setInvoices(invoicesMap);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const viewInvoice = async (orderId: number) => {
    setLoadingInvoice(orderId.toString());
    try {
      const invoice = invoices[orderId];
      if (invoice?.pdf_url) {
        const invoiceResponse = await fetch(invoice.pdf_url);
        const invoiceData = await invoiceResponse.json();

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(invoiceData.html);
          printWindow.document.close();
        }
      } else {
        toast.error('Bon de commande non disponible');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Erreur lors de l\'ouverture du bon de commande');
    } finally {
      setLoadingInvoice(null);
    }
  };

  const downloadInvoice = async (orderId: number) => {
    let tempContainer: HTMLElement | null = null;
    const loadingToastId = toast.loading('Génération du PDF en cours...');
    setLoadingInvoice(orderId.toString());

    try {
      const invoice = invoices[orderId];

      if (!invoice?.pdf_url) {
        toast.dismiss(loadingToastId);
        toast.error('Bon de commande non disponible');
        return;
      }

      const invoiceResponse = await fetch(invoice.pdf_url);
      if (!invoiceResponse.ok) {
        throw new Error('Impossible de charger le document');
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.html) {
        throw new Error('Le document est invalide');
      }

      // Create temporary container for HTML
      tempContainer = document.createElement('div');
      tempContainer.innerHTML = invoiceData.html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      document.body.appendChild(tempContainer);

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `bon-commande-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Generate and download PDF
      const htmlElement = tempContainer.querySelector('.container') as HTMLElement;
      if (!htmlElement) {
        throw new Error('Structure du document invalide');
      }

      await html2pdf().set(opt).from(htmlElement).save();

      // Cleanup
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }

      toast.dismiss(loadingToastId);
      toast.success('Bon de commande téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading invoice:', error);

      // Cleanup on error
      if (tempContainer && document.body.contains(tempContainer)) {
        try {
          document.body.removeChild(tempContainer);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      toast.dismiss(loadingToastId);
      toast.error(`Erreur: ${(error as Error).message}`);
    } finally {
      setLoadingInvoice(null);
    }
  };

  const openGuestbookForm = (order: Order) => {
    setSelectedOrder(order);
    setShowGuestbookDialog(true);
  };

  const handleGuestbookSuccess = async () => {
    setShowGuestbookDialog(false);
    setSelectedOrder(null);
    await loadOrders();
    toast.success('Merci pour votre mot doux ! Il sera publié après validation.');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#b8933d]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore passé de commande
            </p>
            <Link
              href="/en-rayon"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#b8933d] hover:bg-[#a07c2f] text-white rounded-lg transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#b8933d] rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Mes commandes</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {orders.length} commande{orders.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Commande #{order.order_number}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="relative w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product_slug}`}
                      className="font-medium text-gray-900 hover:text-[#b8933d] transition-colors"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-[#b8933d]">{formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#b8933d]">
                  {order.total_amount.toFixed(2)} €
                </span>
              </div>

              {order.woocommerce_order_id &&
                invoices[order.woocommerce_order_id] && (
                  <div className="pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewInvoice(order.woocommerce_order_id!)}
                        disabled={loadingInvoice === order.woocommerce_order_id?.toString()}
                        className="flex-1 sm:flex-none text-[#b8933d] border-[#b8933d] hover:bg-[#b8933d] hover:text-white"
                      >
                        {loadingInvoice === order.woocommerce_order_id?.toString() ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Voir le bon de commande
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(order.woocommerce_order_id!)}
                        disabled={loadingInvoice === order.woocommerce_order_id?.toString()}
                        className="flex-1 sm:flex-none text-[#b8933d] border-[#b8933d] hover:bg-[#b8933d] hover:text-white"
                      >
                        {loadingInvoice === order.woocommerce_order_id?.toString() ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Télécharger
                      </Button>
                    </div>
                  </div>
                )}

              {order.status === 'delivered' && (
                <div className="pt-4 border-t">
                  {order.has_guestbook_entry ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-green-600 border-green-600"
                      disabled
                    >
                      <CheckCircle className="h-5 w-5" />
                      Avis publié ✅
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openGuestbookForm(order)}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    >
                      <Gem className="h-5 w-5" />
                      Signer le Livre d&apos;Or - Gagnez 0,20 € !
                    </Button>
                  )}
                  {!order.has_guestbook_entry && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      ✨ Morgane attend votre mot doux ! Signez le livre d&apos;or et gagnez 0,20 € immédiatement.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedOrder && (
        <Dialog open={showGuestbookDialog} onOpenChange={setShowGuestbookDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gem className="h-6 w-6 text-amber-500" />
                Signer le Livre d&apos;Or
              </DialogTitle>
            </DialogHeader>
            <GuestbookForm
              orderId={selectedOrder.id}
              orderNumber={selectedOrder.order_number}
              onSuccess={handleGuestbookSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
