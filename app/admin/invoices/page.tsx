'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminInvoicesHistoryPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false }); // Plus récentes en premier
      setInvoices(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur chargement historique");
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    if (invoices.length === 0) return;
    setDownloading(true);
    const zip = new JSZip();
    const folder = zip.folder("factures_export");

    try {
      // Téléchargement par lots pour éviter de saturer
      const promises = invoices.map(async (inv) => {
        if (!inv.pdf_url) return;
        try {
          const res = await fetch(inv.pdf_url);
          const blob = await res.blob();
          folder?.file(`${inv.invoice_number}.pdf`, blob);
        } catch (e) {
          console.error(`Erreur téléchargement ${inv.invoice_number}`, e);
        }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `export_factures_${format(new Date(), 'yyyy-MM-dd')}.zip`);
      toast.success("Téléchargement terminé !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du ZIP");
    } finally {
      setDownloading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Historique des Factures</h1>
        <Button onClick={downloadAll} disabled={downloading || invoices.length === 0} className="bg-[#D4AF37] hover:bg-[#b8933d] text-white">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Tout télécharger (ZIP)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Liste des documents générés</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Rechercher (N°, Nom client)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Chargement...</div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Numéro</th>
                    <th className="p-4">Date Création</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4 text-right">Télécharger</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{inv.invoice_number}</td>
                      <td className="p-4">{format(new Date(inv.created_at), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="p-4">{inv.customer_name}</td>
                      <td className="p-4 font-medium">{inv.amount} €</td>
                      <td className="p-4 text-right">
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="text-gray-500 hover:text-[#D4AF37]">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">Aucune facture trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}