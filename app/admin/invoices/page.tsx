'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AdminInvoicesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les commandes du mois sélectionné qui n'ont PAS encore de facture
      // On commence par récupérer les IDs des commandes déjà facturées
      const { data: existingInvoices } = await supabase.from('invoices').select('order_id');
      const invoicedOrderIds = existingInvoices?.map(inv => inv.order_id) || [];

      // Récupérer les commandes
      const startOfMonth = `${selectedMonth}-01`;
      // Astuce pour la fin du mois
      const date = new Date(selectedMonth);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });

      // Filtrer celles qui ne sont pas facturées
      const toInvoice = ordersData?.filter(o => !invoicedOrderIds.includes(o.id)) || [];
      setOrders(toInvoice);

      // 2. Récupérer l'historique des factures
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_number', { ascending: false }); // Les plus récentes en premier
      
      setInvoices(invoicesData || []);

    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS DE SÉLECTION ---

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) setSelectedOrders([]);
    else setSelectedOrders(orders.map(o => o.id));
  };

  const handleSelectCB = () => {
    // Suppose que le champ s'appelle 'payment_method' et contient 'stripe' ou 'card'
    const cbOrders = orders.filter(o => 
      o.payment_method?.toLowerCase().includes('stripe') || 
      o.payment_method?.toLowerCase().includes('card') ||
      o.payment_method?.toLowerCase().includes('cb')
    ).map(o => o.id);
    setSelectedOrders(cbOrders);
  };

  const toggleOrder = (id: string) => {
    setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // --- GÉNÉRATION DES FACTURES ---

  const getNextInvoiceNumber = async () => {
    // Récupérer le dernier numéro de facture en base
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentYear = new Date().getFullYear();
    
    if (!data) return `FAC-${currentYear}-0001`;

    const lastNum = data.invoice_number; // Ex: FAC-2024-0045
    const parts = lastNum.split('-');
    
    if (parts.length === 3) {
      const lastYear = parseInt(parts[1]);
      const sequence = parseInt(parts[2]);

      if (lastYear === currentYear) {
        // On incrémente
        return `FAC-${currentYear}-${String(sequence + 1).padStart(4, '0')}`;
      }
    }
    // Nouvelle année ou format inconnu
    return `FAC-${currentYear}-0001`;
  };

  const handleGenerateInvoices = async () => {
    if (selectedOrders.length === 0) return;
    setGenerating(true);
    let successCount = 0;

    try {
      // Trier les commandes par date (les plus anciennes d'abord) pour que les numéros suivent l'ordre chrono
      const ordersToProcess = orders
        .filter(o => selectedOrders.includes(o.id))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Pour éviter les doublons de numéros, on doit les générer séquentiellement
      // Note: C'est une méthode simple. Pour un trafic très élevé, il faudrait une fonction DB.
      
      // On récupère le point de départ
      let currentInvoiceNumStr = await getNextInvoiceNumber(); 
      // Petit hack pour extraire le numéro de séquence initial
      let currentSeq = parseInt(currentInvoiceNumStr.split('-')[2]);
      const currentYear = new Date().getFullYear();

      for (const order of ordersToProcess) {
        // 1. Construire le numéro
        const invoiceNum = `FAC-${currentYear}-${String(currentSeq).padStart(4, '0')}`;
        currentSeq++;

        // 2. Générer le PDF
        const doc = generateInvoicePDF(order, invoiceNum);
        const pdfBlob = doc.output('blob');

        // 3. Upload vers Supabase Storage
        const fileName = `${invoiceNum}_${order.id}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

        if (uploadError) {
          console.error("Erreur upload", uploadError);
          continue;
        }

        // 4. Obtenir l'URL publique
        const { data: publicUrlData } = supabase.storage.from('invoices').getPublicUrl(fileName);

        // 5. Enregistrer en base
        const { error: dbError } = await supabase.from('invoices').insert({
          order_id: order.id,
          invoice_number: invoiceNum,
          customer_name: `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
          amount: order.total_amount,
          pdf_url: publicUrlData.publicUrl,
          payment_method: order.payment_method
        });

        if (!dbError) successCount++;
      }

      toast.success(`${successCount} factures générées avec succès !`);
      setSelectedOrders([]);
      fetchData(); // Rafraîchir les listes

    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la génération.");
    } finally {
      setGenerating(false);
    }
  };

  // --- TÉLÉCHARGEMENT ---

  const downloadAllInvoices = async () => {
    const zip = new JSZip();
    const folder = zip.folder("factures");
    setGenerating(true);

    try {
      // Télécharger chaque PDF et l'ajouter au ZIP
      // On limite aux factures du mois sélectionné ou tout si désiré
      // Ici on télécharge toutes les factures affichées dans l'historique
      const promises = invoices.map(async (inv) => {
        if (!inv.pdf_url) return;
        const response = await fetch(inv.pdf_url);
        const blob = await response.blob();
        folder?.file(`${inv.invoice_number}.pdf`, blob);
      });

      await Promise.all(promises);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `factures_export_${format(new Date(), 'yyyy-MM-dd')}.zip`);
      toast.success("Téléchargement lancé !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du ZIP");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Factures</h1>
        <div className="flex gap-4">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="generator">Générateur ({orders.length} à traiter)</TabsTrigger>
          <TabsTrigger value="history">Historique ({invoices.length})</TabsTrigger>
        </TabsList>

        {/* --- ONGLET 1 : GÉNÉRATEUR --- */}
        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Commandes en attente de facturation</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSelectAll}>Tout cocher</Button>
                  <Button variant="outline" onClick={handleSelectCB} className="gap-2">
                    <CreditCard className="w-4 h-4" /> Cocher CB
                  </Button>
                  <Button 
                    onClick={handleGenerateInvoices} 
                    disabled={selectedOrders.length === 0 || generating}
                    className="bg-[#D4AF37] hover:bg-[#b8933d] text-white"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Générer {selectedOrders.length} facture(s)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10">Chargement...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">Toutes les commandes de ce mois sont facturées ! 🎉</div>
              ) : (
                <div className="border rounded-md">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4"><Checkbox checked={selectedOrders.length === orders.length && orders.length > 0} onCheckedChange={handleSelectAll} /></th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Client</th>
                        <th className="p-4">Montant</th>
                        <th className="p-4">Paiement</th>
                        <th className="p-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <Checkbox 
                              checked={selectedOrders.includes(order.id)} 
                              onCheckedChange={() => toggleOrder(order.id)} 
                            />
                          </td>
                          <td className="p-4">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</td>
                          <td className="p-4 font-medium">
                            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                          </td>
                          <td className="p-4 font-bold">{order.total_amount} €</td>
                          <td className="p-4">
                            <Badge variant="outline" className={
                              order.payment_method?.toLowerCase().includes('stripe') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100'
                            }>
                              {order.payment_method || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {order.status}
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
        </TabsContent>

        {/* --- ONGLET 2 : HISTORIQUE --- */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Factures générées</CardTitle>
                <Button variant="outline" onClick={downloadAllInvoices} disabled={invoices.length === 0 || generating}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger tout (ZIP)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4">Numéro</th>
                      <th className="p-4">Date création</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Montant</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-bold text-[#D4AF37]">{inv.invoice_number}</td>
                        <td className="p-4">{format(new Date(inv.created_at), 'dd/MM/yyyy')}</td>
                        <td className="p-4">{inv.customer_name}</td>
                        <td className="p-4">{inv.amount} €</td>
                        <td className="p-4 text-right">
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4 text-gray-500" />
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}