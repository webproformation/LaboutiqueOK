'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function AdminInvoiceGenerator() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchOrders();
  }, [selectedMonth]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 1. Commandes déjà facturées
      const { data: existingInvoices } = await supabase.from('invoices').select('order_id');
      const invoicedOrderIds = existingInvoices?.map(inv => inv.order_id) || [];

      // 2. Commandes du mois
      const startOfMonth = `${selectedMonth}-01`;
      const date = new Date(selectedMonth);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });

      // On garde uniquement les NON facturées
      const toInvoice = ordersData?.filter(o => !invoicedOrderIds.includes(o.id)) || [];
      setOrders(toInvoice);
      setSelectedOrders([]); // Reset sélection

    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map(o => o.id));
  };

  const handleSelectCB = () => {
    const cbOrders = orders.filter(o => 
      o.payment_method?.toLowerCase().includes('stripe') || 
      o.payment_method?.toLowerCase().includes('card') ||
      o.payment_method?.toLowerCase().includes('cb')
    ).map(o => o.id);
    setSelectedOrders(cbOrders);
  };

  const getNextInvoiceNumber = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentYear = new Date().getFullYear();
    if (!data) return `FAC-${currentYear}-0001`;

    const lastNum = data.invoice_number;
    const parts = lastNum.split('-');
    
    if (parts.length === 3) {
      const lastYear = parseInt(parts[1]);
      const sequence = parseInt(parts[2]);
      if (lastYear === currentYear) return `FAC-${currentYear}-${String(sequence + 1).padStart(4, '0')}`;
    }
    return `FAC-${currentYear}-0001`;
  };

  const handleGenerateInvoices = async () => {
    if (selectedOrders.length === 0) return;
    setGenerating(true);
    let successCount = 0;

    try {
      // Tri par date de COMMANDE (plus ancienne d'abord pour suite logique)
      const ordersToProcess = orders
        .filter(o => selectedOrders.includes(o.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let currentInvoiceNumStr = await getNextInvoiceNumber(); 
      let currentSeq = parseInt(currentInvoiceNumStr.split('-')[2]);
      const currentYear = new Date().getFullYear();

      for (const order of ordersToProcess) {
        const invoiceNum = `FAC-${currentYear}-${String(currentSeq).padStart(4, '0')}`;
        currentSeq++;

        // Génération PDF
        const doc = generateInvoicePDF(order, invoiceNum);
        const pdfBlob = doc.output('blob');

        // Upload
        const fileName = `${invoiceNum}_${order.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

        if (uploadError) {
          console.error("Upload error", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(fileName);

        // Save DB
        const { error: dbError } = await supabase.from('invoices').insert({
          order_id: order.id,
          invoice_number: invoiceNum,
          customer_name: `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
          amount: order.total_amount,
          pdf_url: publicUrlData.publicUrl,
          payment_method: order.payment_method,
          created_at: new Date().toISOString() // Date de génération
        });

        if (!dbError) successCount++;
      }

      toast.success(`${successCount} factures générées !`);
      fetchOrders();

    } catch (error) {
      console.error(error);
      toast.error("Erreur durant la génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-[#D4AF37]/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#D4AF37]">
              <FileText className="h-6 w-6" />
              Générateur de Factures
            </CardTitle>
            <CardDescription>Convertissez vos commandes en factures officielles</CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm">
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-0 focus:ring-0 text-sm font-medium text-gray-600 bg-transparent"
            />
            <Button size="icon" variant="ghost" onClick={fetchOrders} title="Actualiser">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" onClick={handleSelectAll} className="rounded-xl">Tout cocher</Button>
          <Button variant="outline" onClick={handleSelectCB} className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
            <CreditCard className="w-4 h-4 mr-2" /> Cocher CB/Stripe
          </Button>
          <div className="flex-1" />
          <Button 
            onClick={handleGenerateInvoices} 
            disabled={selectedOrders.length === 0 || generating}
            className="bg-[#D4AF37] hover:bg-[#b8933d] text-white rounded-xl shadow-md transition-all hover:scale-105"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
            Générer ({selectedOrders.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Tout est à jour !</p>
            <p className="text-sm text-gray-400">Aucune commande en attente de facturation pour ce mois.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                <tr>
                  <th className="p-4 w-10"><Checkbox checked={selectedOrders.length === orders.length && orders.length > 0} onCheckedChange={handleSelectAll} /></th>
                  <th className="p-4">Date Commande</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Montant</th>
                  <th className="p-4">Paiement</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFF9F0] transition-colors cursor-pointer" onClick={() => {
                    const newSelection = selectedOrders.includes(order.id) 
                      ? selectedOrders.filter(id => id !== order.id)
                      : [...selectedOrders, order.id];
                    setSelectedOrders(newSelection);
                  }}>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)} 
                        onCheckedChange={(c) => {
                          const newSelection = c 
                            ? [...selectedOrders, order.id] 
                            : selectedOrders.filter(id => id !== order.id);
                          setSelectedOrders(newSelection);
                        }} 
                      />
                    </td>
                    <td className="p-4 font-medium text-gray-900">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                    <td className="p-4">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</td>
                    <td className="p-4 font-bold text-[#D4AF37]">{parseFloat(order.total_amount).toFixed(2)} €</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-white">
                        {order.payment_method || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                        {order.status === 'completed' ? 'Payé' : order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}