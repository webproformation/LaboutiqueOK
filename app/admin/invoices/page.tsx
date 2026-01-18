'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Download, Send, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminInvoicesListingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error("Erreur chargement factures");
    else setInvoices(data || []);
    setLoading(false);
  };

  const handleSendEmail = async (invoice: any) => {
    setSendingId(invoice.id);
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Erreur d'envoi");

      toast.success(`Facture envoyée à ${invoice.customer_name}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setSendingId(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Factures</h1>
          <p className="text-gray-500">Historique et envoi des factures clients</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#D4AF37]" />
            Liste des factures générées ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucune facture trouvée</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b text-gray-500 font-medium">
                  <tr>
                    <th className="p-4">Numéro</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 group">
                      <td className="p-4 font-bold text-[#D4AF37]">{invoice.invoice_number}</td>
                      <td className="p-4 text-gray-600">{format(new Date(invoice.created_at), 'dd/MM/yyyy')}</td>
                      <td className="p-4">{invoice.customer_name}</td>
                      <td className="p-4 font-bold">{parseFloat(invoice.amount).toFixed(2)} €</td>
                      <td className="p-4 flex justify-end gap-2">
                        {/* Bouton Télécharger */}
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" title="Voir le PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>

                        {/* Bouton Envoyer Email */}
                        <Button 
                          size="sm" 
                          onClick={() => handleSendEmail(invoice)}
                          disabled={sendingId === invoice.id}
                          className="bg-[#D4AF37] hover:bg-[#b8933d] text-white transition-all"
                        >
                          {sendingId === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" /> Envoyer
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}