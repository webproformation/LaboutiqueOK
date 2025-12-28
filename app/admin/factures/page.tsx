"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download, Send, Search, Eye, Archive } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Invoice {
  id: string;
  invoice_number: string;
  order_number: string;
  woocommerce_order_id: number;
  customer_email: string;
  pdf_url: string;
  sent_at: string | null;
  generated_at: string;
}

interface MonthlyInvoices {
  month: string;
  year: number;
  invoices: Invoice[];
}

export default function AdminFacturesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [monthlyInvoices, setMonthlyInvoices] = useState<MonthlyInvoices[]>([]);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [search, selectedMonth, selectedYear, invoices]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data = await response.json();
      const invoicesList: Invoice[] = data.invoices || [];
      setInvoices(invoicesList);

      organizeByMonth(invoicesList);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const organizeByMonth = (invoicesList: Invoice[]) => {
    const monthlyMap = new Map<string, Invoice[]>();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    invoicesList.forEach(invoice => {
      const date = new Date(invoice.generated_at);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, []);
      }
      monthlyMap.get(key)!.push(invoice);
    });

    const monthly: MonthlyInvoices[] = Array.from(monthlyMap.entries())
      .map(([key, invoices]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: monthNames[month],
          year,
          invoices: invoices.sort((a, b) =>
            new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
          )
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return monthNames.indexOf(b.month) - monthNames.indexOf(a.month);
      });

    setMonthlyInvoices(monthly);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchLower) ||
        invoice.order_number.toLowerCase().includes(searchLower) ||
        invoice.customer_email.toLowerCase().includes(searchLower)
      );
    }

    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      filtered = filtered.filter(invoice => {
        const date = new Date(invoice.generated_at);
        return date.getMonth() === parseInt(selectedMonth) &&
               date.getFullYear() === parseInt(selectedYear);
      });
    } else if (selectedYear !== 'all') {
      filtered = filtered.filter(invoice => {
        const date = new Date(invoice.generated_at);
        return date.getFullYear() === parseInt(selectedYear);
      });
    }

    setFilteredInvoices(filtered);
  };

  const viewInvoice = async (invoice: Invoice) => {
    try {
      const invoiceResponse = await fetch(invoice.pdf_url, {
        credentials: 'include',
      });
      if (!invoiceResponse.ok) {
        throw new Error('Impossible de charger le document');
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.html) {
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
      toast.error('Erreur lors de l\'ouverture de la facture');
      console.error('View invoice error:', error);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      toast.loading('Génération du PDF en cours...');

      const invoiceResponse = await fetch(invoice.pdf_url, {
        credentials: 'include',
      });
      if (!invoiceResponse.ok) {
        throw new Error('Impossible de charger le document');
      }

      const invoiceData = await invoiceResponse.json();

      if (!invoiceData.html) {
        toast.error('Le document est invalide');
        return;
      }

      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = invoiceData.html;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      document.body.appendChild(tempContainer);

      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `facture-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        }
      };

      const htmlElement = tempContainer.firstElementChild as HTMLElement;
      if (!htmlElement) {
        throw new Error('Erreur lors de la conversion du HTML');
      }

      await html2pdf().set(opt).from(htmlElement).save();

      document.body.removeChild(tempContainer);

      toast.dismiss();
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de la génération du PDF');
      console.error('Download error:', error);
    }
  };

  const downloadMonthlyZip = async (monthData: MonthlyInvoices) => {
    const zipKey = `${monthData.year}-${monthData.month}`;
    setDownloadingZip(zipKey);

    try {
      toast.loading(`Préparation du ZIP pour ${monthData.month} ${monthData.year}...`);

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const invoice of monthData.invoices) {
        try {
          const invoiceResponse = await fetch(invoice.pdf_url, {
            credentials: 'include',
          });
          if (!invoiceResponse.ok) continue;

          const invoiceData = await invoiceResponse.json();
          if (!invoiceData.html) continue;

          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = invoiceData.html;
          tempContainer.style.position = 'absolute';
          tempContainer.style.left = '-9999px';
          document.body.appendChild(tempContainer);

          const html2pdf = (await import('html2pdf.js')).default;

          const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number],
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              letterRendering: true
            },
            jsPDF: {
              unit: 'mm' as const,
              format: 'a4' as const,
              orientation: 'portrait' as const
            }
          };

          const htmlElement = tempContainer.firstElementChild as HTMLElement;
          if (htmlElement) {
            const pdfBlob = await html2pdf().set(opt).from(htmlElement).outputPdf('blob');
            zip.file(`${invoice.invoice_number}.pdf`, pdfBlob);
          }

          document.body.removeChild(tempContainer);
        } catch (error) {
          console.error(`Error processing invoice ${invoice.invoice_number}:`, error);
        }
      }

      toast.dismiss();
      toast.loading('Génération du fichier ZIP...');

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factures-${monthData.month}-${monthData.year}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('ZIP téléchargé avec succès');
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors de la création du ZIP');
      console.error('ZIP download error:', error);
    } finally {
      setDownloadingZip(null);
    }
  };

  const sendInvoiceEmail = async (invoiceId: string) => {
    setSendingInvoice(invoiceId);
    try {
      const response = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invoiceId, resend: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Facture envoyée avec succès');
        await loadInvoices();
      } else {
        const errorMsg = data?.details
          ? `${data.error}: ${data.details}`
          : data?.error || 'Erreur lors de l\'envoi';
        toast.error(errorMsg, { duration: 10000 });
      }
    } catch (error) {
      console.error('Send invoice exception:', error);
      toast.error('Erreur lors de l\'envoi de la facture');
    } finally {
      setSendingInvoice(null);
    }
  };

  const availableYears = Array.from(new Set(monthlyInvoices.map(m => m.year))).sort((a, b) => b - a);
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-[#b8933d]" />
          Gestion des Factures
        </h1>
        <p className="text-gray-600 mt-2">
          Consulter, télécharger et envoyer les factures générées
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Rechercher par n° facture, commande ou client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les années</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#b8933d]" />
        </div>
      ) : (
        <>
          {search || selectedMonth !== 'all' || selectedYear !== 'all' ? (
            <Card>
              <CardHeader>
                <CardTitle>Résultats de la recherche ({filteredInvoices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredInvoices.length === 0 ? (
                  <p className="text-center text-gray-600 py-6">Aucune facture trouvée</p>
                ) : (
                  <div className="space-y-2">
                    {filteredInvoices.map(invoice => (
                      <div
                        key={invoice.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <FileText className="w-10 h-10 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-sm text-gray-600">
                            Commande #{invoice.order_number} - {invoice.customer_email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(invoice.generated_at).toLocaleDateString('fr-FR')}
                            {invoice.sent_at && (
                              <span className="ml-2 text-green-600">
                                • Envoyée le {new Date(invoice.sent_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewInvoice(invoice)}
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadInvoice(invoice)}
                            title="Télécharger PDF"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendInvoiceEmail(invoice.id)}
                            disabled={sendingInvoice === invoice.id}
                            title={invoice.sent_at ? 'Renvoyer par email' : 'Envoyer par email'}
                          >
                            {sendingInvoice === invoice.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {monthlyInvoices.map((monthData) => (
                <Card key={`${monthData.year}-${monthData.month}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {monthData.month} {monthData.year} ({monthData.invoices.length} facture{monthData.invoices.length > 1 ? 's' : ''})
                      </CardTitle>
                      <Button
                        onClick={() => downloadMonthlyZip(monthData)}
                        disabled={downloadingZip === `${monthData.year}-${monthData.month}`}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        {downloadingZip === `${monthData.year}-${monthData.month}` ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Archive className="w-4 h-4" />
                            Télécharger le mois en ZIP
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {monthData.invoices.map(invoice => (
                        <div
                          key={invoice.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <FileText className="w-10 h-10 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{invoice.invoice_number}</div>
                            <div className="text-sm text-gray-600">
                              Commande #{invoice.order_number} - {invoice.customer_email}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(invoice.generated_at).toLocaleDateString('fr-FR')}
                              {invoice.sent_at && (
                                <span className="ml-2 text-green-600">
                                  • Envoyée le {new Date(invoice.sent_at).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewInvoice(invoice)}
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoice(invoice)}
                              title="Télécharger PDF"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendInvoiceEmail(invoice.id)}
                              disabled={sendingInvoice === invoice.id}
                              title={invoice.sent_at ? 'Renvoyer par email' : 'Envoyer par email'}
                            >
                              {sendingInvoice === invoice.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {monthlyInvoices.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Aucune facture générée pour le moment</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
