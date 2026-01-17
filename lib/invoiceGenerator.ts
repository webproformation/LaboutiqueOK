import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateInvoicePDF = (order: any, invoiceNumber: string) => {
  const doc = new jsPDF();

  // --- EN-TÊTE ---
  doc.setFontSize(20);
  doc.text("LA BOUTIQUE DE MORGANE", 14, 20);
  
  doc.setFontSize(10);
  doc.text("Shopping en Live", 14, 26);
  doc.text("contact@laboutiquedemorgane.com", 14, 31);
  // Ajoutez votre adresse / SIRET ici si besoin

  // --- INFO FACTURE ---
  doc.setFontSize(16);
  doc.text("FACTURE", 140, 20);
  
  doc.setFontSize(10);
  doc.text(`Numéro : ${invoiceNumber}`, 140, 28);
  doc.text(`Date : ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}`, 140, 33);
  doc.text(`Ref Commande : ${order.id.slice(0, 8)}`, 140, 38);

  // --- CLIENT ---
  doc.text("Facturé à :", 14, 50);
  doc.setFont("helvetica", "bold");
  doc.text(`${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`, 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.shipping_address?.address_line1 || ''}`, 14, 60);
  doc.text(`${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`, 14, 65);
  doc.text(`${order.shipping_address?.country || ''}`, 14, 70);

  // --- TABLEAU DES PRODUITS ---
  const tableColumn = ["Produit", "Quantité", "Prix Unitaire", "Total"];
  const tableRows: any[] = [];

  order.items?.forEach((item: any) => {
    const itemData = [
      item.product_name + (item.variation_name ? ` (${item.variation_name})` : ''),
      item.quantity,
      `${Number(item.price).toFixed(2)} €`,
      `${(Number(item.price) * item.quantity).toFixed(2)} €`,
    ];
    tableRows.push(itemData);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: 80,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [212, 175, 55] }, // Couleur Or
  });

  // --- TOTAUX ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.text(`Sous-total :`, 140, finalY);
  doc.text(`${Number(order.total_amount).toFixed(2)} €`, 180, finalY, { align: 'right' });
  
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL NET À PAYER :`, 140, finalY + 10);
  doc.text(`${Number(order.total_amount).toFixed(2)} €`, 180, finalY + 10, { align: 'right' });

  // --- PIED DE PAGE ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Mode de paiement : " + (order.payment_method || 'Non spécifié'), 14, finalY + 20);
  doc.text("Merci de votre confiance !", 105, 280, { align: 'center' });

  return doc;
};