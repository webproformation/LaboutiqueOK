'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, CreditCard, RefreshCw, CheckCircle, Download, History, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function AdminInvoiceGenerator() {
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'todo' | 'history'>('todo');

  useEffect(() => { fetchOrders(); }, [selectedMonth]);

  // --- UTILITAIRES D'AFFICHAGE ET CORRECTIONS ---
  const getOrderTotal = (order: any) => {
    const val = order.total_amount || order.total || order.amount || 0;
    return parseFloat(val);
  };

  // Récupère le moyen de paiement avec une valeur par défaut si vide
  const getPaymentMethod = (order: any) => {
    if (order.payment_method) return order.payment_method;
    // Fallback : Si vide, on suppose CB / Stripe (standard web)
    return "CB / Stripe";
  };

  // Récupère le statut (cherche payment_status ou status)
  const getStatusRaw = (order: any) => {
    return order.payment_status || order.status || 'pending';
  };

  const translateStatus = (status: string) => {
    if (!status) return 'En attente';
    switch (status.toLowerCase()) {
      case 'paid': 
      case 'succeeded': return 'Payé';
      case 'pending': return 'En attente';
      case 'failed': return 'Échoué';
      case 'refunded': return 'Remboursé';
      case 'shipped': return 'Expédié (Payé)'; // Souvent expédié = payé
      case 'processing': return 'Traitement';
      default: return 'Payé'; // Par défaut pour les commandes web validées
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    switch (status.toLowerCase()) {
      case 'paid': 
      case 'succeeded':
      case 'shipped':
        return 'bg-green-100 text-green-800 border-green-200'; // Vert
      case 'pending': 
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Jaune
      case 'failed': 
        return 'bg-red-100 text-red-800 border-red-200'; // Rouge
      default: 
        return 'bg-green-100 text-green-800 border-green-200'; // Vert par défaut si validé
    }
  };
  // --------------------------------

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const startOfMonth = `${selectedMonth}-01`;
      const date = new Date(selectedMonth);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });

      if (!ordersData) { setOrders([]); setHistory([]); setLoading(false); return; }

      const orderIds = ordersData.map(o => o.id);
      const { data: invoicesData } = await supabase.from('invoices').select('*').in('order_id', orderIds);
      const existingInvoiceMap = new Map(invoicesData?.map(inv => [inv.order_id, inv]));

      const toInvoice: any[] = [];
      const doneInvoice: any[] = [];

      ordersData.forEach(order => {
        if (existingInvoiceMap.has(order.id)) {
          doneInvoice.push({ ...order, invoice_info: existingInvoiceMap.get(order.id) });
        } else {
          toInvoice.push(order);
        }
      });

      setOrders(toInvoice);
      setHistory(doneInvoice);
      setSelectedOrders([]);

    } catch (error) { console.error(error); toast.error("Erreur de chargement"); } finally { setLoading(false); }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map(o => o.id));
  };

  const handleSelectCB = () => {
    // Sélectionne tout ce qui est payé ou via stripe/cb
    const cbOrders = orders.filter(o => {
      const method = getPaymentMethod(o).toLowerCase();
      const status = getStatusRaw(o).toLowerCase();
      return method.includes('stripe') || method.includes('card') || method.includes('cb') || status === 'paid';
    }).map(o => o.id);
    setSelectedOrders(cbOrders);
  };

  const getNextSequence = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentYear = new Date().getFullYear();
    
    if (!data || !data.invoice_number) return { year: currentYear, sequence: 1 };

    const parts = data.invoice_number.split('-');
    if (parts.length === 2 && parts[0].startsWith('FA')) {
      const lastYear = parseInt(parts[0].replace('FA', ''));
      const lastSeq = parseInt(parts[1]);
      if (lastYear === currentYear) return { year: currentYear, sequence: lastSeq + 1 };
    }
    return { year: currentYear, sequence: 1 };
  };

  const handleGenerateInvoices = async () => {
    if (selectedOrders.length === 0) return;
    setGenerating(true);
    let successCount = 0;

    try {
      const ordersToProcess = orders
        .filter(o => selectedOrders.includes(o.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let { year, sequence } = await getNextSequence();

      for (const order of ordersToProcess) {
        const invoiceNum = `FA${year}-${String(sequence).padStart(7, '0')}`;
        sequence++;

        // Utiliser le moyen de paiement calculé pour le PDF aussi
        const orderForPdf = {
            ...order,
            payment_method: getPaymentMethod(order)
        };

        const doc = await generateInvoicePDF(orderForPdf, invoiceNum);
        const pdfBlob = doc.output('blob');
        const fileName = `${invoiceNum}_${order.id}.pdf`;
        
        const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
        if (uploadError) { console.error("Upload error", uploadError); continue; }

        const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('invoices').insert({
          order_id: order.id,
          invoice_number: invoiceNum,
          customer_name: `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
          amount: getOrderTotal(order),
          pdf_url: publicUrlData.publicUrl,
          payment_method: getPaymentMethod(order), // Sauvegarde le "CB / Stripe" si vide
          created_at: new Date().toISOString()
        });

        if (!dbError) successCount++;
      }
      toast.success(`${successCount} factures générées !`);
      fetchOrders();
    } catch (error) { console.error(error); toast.error("Erreur durant la génération"); } finally { setGenerating(false); }
  };

  return (
    <Card className="border-2 border-[#D4AF37]/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#D4AF37]"><FileText className="h-6 w-6" />Générateur de Factures</CardTitle>
            <CardDescription>Gérez la facturation mensuelle de vos commandes</CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm">
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border-0 focus:ring-0 text-sm font-medium text-gray-600 bg-transparent" />
            <Button size="icon" variant="ghost" onClick={fetchOrders} title="Actualiser"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={() => setActiveTab('todo')} variant={activeTab === 'todo' ? 'default' : 'outline'} className={activeTab === 'todo' ? 'bg-[#D4AF37] hover:bg-[#b8933d]' : ''}><FilePlus className="w-4 h-4 mr-2" />À générer ({orders.length})</Button>
          <Button onClick={() => setActiveTab('history')} variant={activeTab === 'history' ? 'default' : 'outline'} className={activeTab === 'history' ? 'bg-[#D4AF37] hover:bg-[#b8933d]' : ''}><History className="w-4 h-4 mr-2" />Déjà générées ({history.length})</Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div> : (
          <>
            {activeTab === 'todo' && (
              <>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button variant="outline" onClick={handleSelectAll} className="rounded-xl">Tout cocher</Button>
                  <Button variant="outline" onClick={handleSelectCB} className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"><CreditCard className="w-4 h-4 mr-2" /> Cocher Payées / CB</Button>
                  <div className="flex-1" />
                  <Button onClick={handleGenerateInvoices} disabled={selectedOrders.length === 0 || generating} className="bg-[#D4AF37] hover:bg-[#b8933d] text-white rounded-xl shadow-md transition-all hover:scale-105">{generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}Générer ({selectedOrders.length})</Button>
                </div>
                {orders.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed"><CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" /><p className="text-gray-600 font-medium">Tout est à jour !</p></div> : (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                        <tr>
                            <th className="p-4 w-10"><Checkbox checked={selectedOrders.length === orders.length && orders.length > 0} onCheckedChange={handleSelectAll} /></th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Montant</th>
                            {/* NOUVELLES COLONNES SÉPARÉES */}
                            <th className="p-4">État</th>
                            <th className="p-4">Moyen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#FFF9F0] transition-colors cursor-pointer" onClick={() => setSelectedOrders(selectedOrders.includes(order.id) ? selectedOrders.filter(id => id !== order.id) : [...selectedOrders, order.id])}>
                            <td className="p-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={(c) => setSelectedOrders(c ? [...selectedOrders, order.id] : selectedOrders.filter(id => id !== order.id))} /></td>
                            <td className="p-4 font-medium text-gray-900">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                            <td className="p-4">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</td>
                            <td className="p-4 font-bold text-[#D4AF37]">{getOrderTotal(order).toFixed(2)} €</td>
                            
                            {/* COLONNE ÉTAT */}
                            <td className="p-4">
                                <Badge variant="outline" className={getStatusColor(getStatusRaw(order))}>
                                  {translateStatus(getStatusRaw(order))}
                                </Badge>
                            </td>

                            {/* COLONNE MOYEN (AVEC FALLBACK) */}
                            <td className="p-4 text-gray-600 font-medium">
                                {getPaymentMethod(order)}
                            </td>
                            
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            {activeTab === 'history' && (
              <>
                {history.length === 0 ? <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed"><History className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium">Aucune facture générée</p></div> : (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b text-gray-500 font-medium"><tr><th className="p-4">N° Facture</th><th className="p-4">Date</th><th className="p-4">Client</th><th className="p-4">Montant</th><th className="p-4 text-right">Action</th></tr></thead>
                      <tbody className="divide-y">
                        {history.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-[#D4AF37]">{order.invoice_info?.invoice_number}</td>
                            <td className="p-4 text-gray-600">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                            <td className="p-4">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</td>
                            <td className="p-4 font-bold">{getOrderTotal(order).toFixed(2)} €</td>
                            <td className="p-4 text-right">
                              {order.invoice_info?.pdf_url ? <a href={order.invoice_info.pdf_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><Download className="w-4 h-4 mr-2" /> PDF</Button></a> : <span className="text-gray-400 text-xs">Indisponible</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}