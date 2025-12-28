"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, FileText, Send, Download } from 'lucide-react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';

interface Order {
  id: number;
  number: string;
  status: string;
  total: string;
  date_created: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    phone: string;
    company: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    postcode: string;
    country: string;
    company: string;
  };
  line_items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: string;
    subtotal: string;
    sku: string;
  }>;
  shipping_lines: Array<{
    method_title: string;
    total: string;
  }>;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  payment_method_title: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  pdf_url: string;
  sent_at: string | null;
}

const statusLabels: Record<string, string> = {
  'pending': 'En attente',
  'processing': 'En traitement',
  'on-hold': 'En attente',
  'completed': 'Terminée',
  'cancelled': 'Annulée',
  'refunded': 'Remboursée',
  'failed': 'Échouée',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [invoices, setInvoices] = useState<Record<number, Invoice>>({});
  const [generatingInvoice, setGeneratingInvoice] = useState<number | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/woocommerce/orders?action=list&page=${page}&per_page=10${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`;

      const response = await fetch(url);

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(parseInt(data.totalPages || '1'));

      // Fetch invoices for all orders
      if (data.orders && data.orders.length > 0) {
        fetchInvoicesForOrders(data.orders);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesForOrders = async (ordersData: Order[]) => {
    try {
      console.log('Fetching invoices for orders:', ordersData.map(o => o.id));

      const invoicePromises = ordersData.map(async (order) => {
        try {
          const response = await fetch(`/api/invoices?orderId=${order.id}`);
          if (!response.ok) {
            console.warn(`Failed to fetch invoice for order ${order.id}:`, response.status);
            return { orderId: order.id, invoice: null };
          }
          const data = await response.json();
          const invoice = data.invoices?.[0] || null;
          if (invoice) {
            console.log(`Found invoice for order ${order.id}:`, invoice.invoice_number);
          } else {
            console.log(`No invoice found for order ${order.id}`);
          }
          return { orderId: order.id, invoice };
        } catch (err) {
          console.error(`Error fetching invoice for order ${order.id}:`, err);
          return { orderId: order.id, invoice: null };
        }
      });

      const results = await Promise.all(invoicePromises);
      const invoicesMap: Record<number, Invoice> = {};
      results.forEach(({ orderId, invoice }) => {
        if (invoice) {
          invoicesMap[orderId] = invoice;
        }
      });

      console.log('Invoices map:', Object.keys(invoicesMap).map(k => `${k}: ${invoicesMap[parseInt(k)].invoice_number}`));
      setInvoices(invoicesMap);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const generateInvoice = async (order: Order, autoSend: boolean = false) => {
    setGeneratingInvoice(order.id);
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          orderData: order,
          autoSend,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(
          autoSend
            ? 'Bon de commande généré et envoyé avec succès'
            : 'Bon de commande généré avec succès'
        );
        if (data.invoice) {
          setInvoices((prev) => ({ ...prev, [order.id]: data.invoice }));
        }
      } else {
        toast.error(data.error || 'Erreur lors de la génération');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du bon de commande');
      console.error(error);
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const sendInvoiceEmail = async (invoiceId: string) => {
    setSendingInvoice(invoiceId);
    try {
      console.log('Sending invoice email for:', invoiceId);
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, resend: true }),
      });

      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Invalid server response');
      }

      if (response.ok) {
        toast.success('Bon de commande envoyé avec succès');
        // Update invoice sent_at
        setInvoices((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(prev).map(([key, invoice]) =>
              invoice.id === invoiceId
                ? [key, { ...invoice, sent_at: new Date().toISOString() }]
                : [key, invoice]
            )
          ),
        }));
      } else {
        const errorMsg = data?.details
          ? `${data.error}: ${data.details}`
          : data?.error || 'Erreur lors de l\'envoi';
        toast.error(errorMsg, { duration: 10000 });
        console.error('Send invoice error:', {
          status: response.status,
          data
        });
      }
    } catch (error) {
      console.error('Send invoice exception:', error);
      toast.error('Erreur lors de l\'envoi du bon de commande: ' + (error as Error).message);
    } finally {
      setSendingInvoice(null);
    }
  };

  const viewInvoice = async (orderId: number) => {
    try {
      const invoice = invoices[orderId];

      if (!invoice) {
        toast.error('Aucune facture trouvée pour cette commande');
        console.error('Invoice not found in state for order:', orderId);
        return;
      }

      if (!invoice.pdf_url) {
        toast.error('URL de la facture manquante');
        console.error('Invoice missing pdf_url:', invoice);
        return;
      }

      console.log('Viewing invoice from:', invoice.pdf_url);

      const invoiceResponse = await fetch(invoice.pdf_url);
      if (!invoiceResponse.ok) {
        console.error('Failed to fetch invoice:', invoiceResponse.status, invoiceResponse.statusText);
        throw new Error('Impossible de charger le document');
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.html) {
        console.error('Invoice data missing html:', invoiceData);
        toast.error('Le document est invalide');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceData.html);
        printWindow.document.close();
      } else {
        toast.error('Le popup a été bloqué par votre navigateur');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du bon de commande');
      console.error('View invoice error:', error);
    }
  };

  const downloadInvoice = async (orderId: number) => {
    let tempContainer: HTMLElement | null = null;
    const loadingToastId = toast.loading('Génération du PDF en cours...');

    try {
      const invoice = invoices[orderId];

      if (!invoice) {
        toast.dismiss(loadingToastId);
        toast.error('Aucune facture trouvée pour cette commande');
        console.error('Invoice not found in state for order:', orderId);
        return;
      }

      if (!invoice.pdf_url) {
        toast.dismiss(loadingToastId);
        toast.error('URL de la facture manquante');
        console.error('Invoice missing pdf_url:', invoice);
        return;
      }

      console.log('Downloading invoice from:', invoice.pdf_url);

      const invoiceResponse = await fetch(invoice.pdf_url);
      if (!invoiceResponse.ok) {
        console.error('Failed to fetch invoice:', invoiceResponse.status, invoiceResponse.statusText);
        throw new Error(`Impossible de charger le document (${invoiceResponse.status})`);
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.html) {
        console.error('Invoice data missing html:', invoiceData);
        throw new Error('Le document est invalide (HTML manquant)');
      }

      console.log('Invoice HTML loaded, creating PDF...');

      // Create a temporary container for the HTML
      tempContainer = document.createElement('div');
      tempContainer.innerHTML = invoiceData.html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      document.body.appendChild(tempContainer);

      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure PDF options
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `bon-commande-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true,
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

      // Convert HTML to PDF and download
      const htmlElement = tempContainer.querySelector('.container') as HTMLElement;
      if (!htmlElement) {
        console.error('Container not found in HTML, using full tempContainer');
        throw new Error('Structure du document invalide');
      }

      console.log('Starting PDF generation...');
      await html2pdf().set(opt).from(htmlElement).save();
      console.log('PDF generation completed');

      // Clean up
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }

      toast.dismiss(loadingToastId);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Download error:', error);

      // Clean up on error
      if (tempContainer && document.body.contains(tempContainer)) {
        try {
          document.body.removeChild(tempContainer);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }

      toast.dismiss(loadingToastId);
      toast.error(`Erreur lors de la génération du PDF: ${(error as Error).message}`, {
        duration: 5000
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filterStatus]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch('/api/woocommerce/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          orderData: { status: newStatus }
        }),
      });

      toast.success('Statut mis à jour');

      // Auto-generate and send invoice when status changes to "processing"
      if (newStatus === 'processing' && !invoices[orderId]) {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          toast.info('Génération du bon de commande en cours...');
          await generateInvoice(order, true);
        }
      }

      fetchOrders();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gestion des Commandes</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        Commande #{order.number}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {order.billing.first_name} {order.billing.last_name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(order.date_created).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-4 sm:gap-2 items-center sm:items-end">
                      <p className="font-bold text-lg">{order.total}€</p>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Package className="w-4 h-4" />
                      <span>Articles:</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {order.line_items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Show invoice buttons if invoice exists, or show generate button if processing */}
                  {(invoices[order.id]?.pdf_url || order.status === 'processing') && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex flex-wrap gap-2">
                        {invoices[order.id]?.pdf_url ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewInvoice(order.id)}
                              className="flex-1 sm:flex-none"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Voir le bon de commande
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(order.id)}
                              className="flex-1 sm:flex-none"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendInvoiceEmail(invoices[order.id].id)}
                              disabled={sendingInvoice === invoices[order.id].id}
                              className="flex-1 sm:flex-none"
                            >
                              {sendingInvoice === invoices[order.id].id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4 mr-2" />
                              )}
                              Envoyer au client
                            </Button>
                            {invoices[order.id].sent_at && (
                              <span className="text-xs text-green-600 self-center">
                                Envoyé le{' '}
                                {new Date(invoices[order.id].sent_at!).toLocaleDateString(
                                  'fr-FR'
                                )}
                              </span>
                            )}
                          </>
                        ) : order.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoice(order, false)}
                            disabled={generatingInvoice === order.id}
                            className="flex-1 sm:flex-none"
                          >
                            {generatingInvoice === order.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            Générer le bon de commande
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="px-4 py-2">
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
