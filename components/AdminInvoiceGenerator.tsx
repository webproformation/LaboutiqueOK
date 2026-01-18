'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { generateInvoicePDF } from '@/lib/invoiceGenerator'; // Ceci importe maintenant la version async
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function AdminInvoiceGenerator() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  useEffect(() => { fetchOrders(); }, [selectedMonth]);

  const fetchOrders = async () => {
    setLoading(true);
    const startOfMonth = `${selectedMonth}-01`;
    const date = new Date(selectedMonth);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();
    const { data } = await supabase.from('orders')
      .select('*, items:order_items(*)')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (selectedOrders.length === 0) return;
    setGenerating(true);
    let count = 0;
    try {
      for (const orderId of selectedOrders) {
        const order = orders.find(o => o.id === orderId);
        if (!order) continue;
        
        const invoiceNum = `FAC-${Date.now()}-${count}`;

        // --- MODIFICATION CRUCIALE ICI ---
        // On ajoute 'await' car la génération charge une image
        const doc = await generateInvoicePDF(order, invoiceNum); 
        // ---------------------------------

        const pdfBlob = doc.output('blob');
        const fileName = `${invoiceNum}.pdf`;
        
        await supabase.storage.from('invoices').upload(fileName, pdfBlob, { upsert: true });
        
        await supabase.from('invoices').insert({
          order_id: order.id,
          invoice_number: invoiceNum,
          customer_name: `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
          amount: order.total_amount,
          created_at: new Date().toISOString()
        });
        count++;
      }
      toast.success(`${count} factures générées`);
      setSelectedOrders([]);
    } catch (e) { 
      console.error(e);
      toast.error("Erreur génération"); 
    } finally { 
      setGenerating(false); 
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Génération Factures</CardTitle>
        <div className="flex gap-2">
          <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border rounded p-1" />
          <Button size="icon" variant="ghost" onClick={fetchOrders}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={handleGenerate} disabled={generating || selectedOrders.length === 0} className="bg-[#D4AF37] text-white">
            {generating ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" />} Générer ({selectedOrders.length})
          </Button>
        </div>
        {loading ? <Loader2 className="animate-spin mx-auto" /> : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 w-10"><Checkbox checked={selectedOrders.length === orders.length && orders.length > 0} onCheckedChange={() => setSelectedOrders(selectedOrders.length === orders.length ? [] : orders.map(o => o.id))} /></th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Montant</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b">
                    <td className="p-3"><Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={(c) => setSelectedOrders(c ? [...selectedOrders, order.id] : selectedOrders.filter(id => id !== order.id))} /></td>
                    <td className="p-3">{format(new Date(order.created_at), 'dd/MM/yyyy')}</td>
                    <td className="p-3">{order.shipping_address?.first_name} {order.shipping_address?.last_name}</td>
                    <td className="p-3 font-bold">{parseFloat(order.total_amount).toFixed(2)}€</td>
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