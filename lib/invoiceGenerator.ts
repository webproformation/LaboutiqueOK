import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateInvoicePDF = (order: any, invoiceNumber: string) => {
  const doc = new jsPDF();
  const orderDate = new Date(order.created_at);
  const primaryColor = "#D4AF37";
  const textColor = "#333333";
  
  // En-tête
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("LA BOUTIQUE DE MORGANE", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "normal");
  doc.text("Shopping en Live", 14, 26);
  doc.text("contact@laboutiquedemorgane.com", 14, 31);

  // Cadre Facture
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(120, 15, 75, 30, 2, 2, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", 125, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "normal");
  doc.text(`N° : ${invoiceNumber}`, 125, 32);
  doc.text(`Date commande : ${format(orderDate, 'dd/MM/yyyy', { locale: fr })}`, 125, 37);
  doc.text(`Réf. Commande : #${order.id.slice(0, 8).toUpperCase()}`, 125, 42);

  // Adresses
  const yAddress = 60;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Émetteur :", 14, yAddress);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text("La Boutique de Morgane", 14, yAddress + 5);
  doc.setFont("helvetica", "normal");
  doc.text("123 Rue de la Mode", 14, yAddress + 10);
  doc.text("75000 Paris, France", 14, yAddress + 15);

  doc.setTextColor(100);
  doc.text("Facturé à :", 110, yAddress);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`, 110, yAddress + 5);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.shipping_address?.address_line1 || ''}`, 110, yAddress + 10);
  if (order.shipping_address?.address_line2) doc.text(`${order.shipping_address.address_line2}`, 110, yAddress + 15);
  doc.text(`${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`, 110, yAddress + (order.shipping_address?.address_line2 ? 20 : 15));
  doc.text(`${order.shipping_address?.country || ''}`, 110, yAddress + (order.shipping_address?.address_line2 ? 25 : 20));

  // Tableau
  const tableColumn = ["Désignation", "Qté", "Prix Unit.", "Total"];
  const tableRows: any[] = [];

  order.items?.forEach((item: any) => {
    const price = parseFloat(item.price) || 0;
    const qty = item.quantity || 1;
    const totalLine = price * qty;
    tableRows.push([
      item.product_name + (item.variation_name ? ` - ${item.variation_name}` : ''),
      qty,
      `${price.toFixed(2)} €`,
      `${totalLine.toFixed(2)} €`,
    ]);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: yAddress + 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } },
  });

  // Totaux
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const totalAmount = parseFloat(order.total_amount) || 0;
  
  doc.setDrawColor(200);
  doc.line(120, finalY, 195, finalY);
  finalY += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL NET À PAYER", 120, finalY);
  doc.text(`${totalAmount.toFixed(2)} €`, 195, finalY, { align: 'right' });

  // Pied de page
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Règlement : ${order.payment_method || 'Non spécifié'} - Statut : ${order.status === 'completed' ? 'Payé' : 'En attente'}`, 14, finalY + 20);
  doc.setFontSize(8);
  doc.text("TVA non applicable, art. 293 B du CGI (Auto-entrepreneur)", 105, 285, { align: 'center' });

  return doc;
};