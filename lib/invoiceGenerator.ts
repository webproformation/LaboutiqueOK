import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateInvoicePDF = (order: any, invoiceNumber: string) => {
  const doc = new jsPDF();
  const orderDate = new Date(order.created_at);

  // --- COULEURS & STYLE ---
  const primaryColor = "#D4AF37"; // Or
  const textColor = "#333333";
  
  // --- EN-TÊTE ---
  doc.setFontSize(22);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("LA BOUTIQUE DE MORGANE", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "normal");
  doc.text("Shopping en Live", 14, 26);
  doc.text("contact@laboutiquedemorgane.com", 14, 31);

  // --- INFO FACTURE (Cadre Droite) ---
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
  // CORRECTION : On utilise la date de la COMMANDE
  doc.text(`Date de création : ${format(orderDate, 'dd/MM/yyyy', { locale: fr })}`, 125, 37);
  doc.text(`Réf. Commande : #${order.id.slice(0, 8).toUpperCase()}`, 125, 42);

  // --- ADRESSES ---
  const yAddress = 60;
  
  // Émetteur
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Émetteur :", 14, yAddress);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text("La Boutique de Morgane", 14, yAddress + 5);
  doc.setFont("helvetica", "normal");
  doc.text("123 Rue de la Mode", 14, yAddress + 10);
  doc.text("75000 Paris, France", 14, yAddress + 15);

  // Client
  doc.setTextColor(100);
  doc.text("Facturé à :", 110, yAddress);
  doc.setTextColor(textColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`, 110, yAddress + 5);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.shipping_address?.address_line1 || ''}`, 110, yAddress + 10);
  if (order.shipping_address?.address_line2) {
    doc.text(`${order.shipping_address.address_line2}`, 110, yAddress + 15);
  }
  doc.text(`${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`, 110, yAddress + (order.shipping_address?.address_line2 ? 20 : 15));
  doc.text(`${order.shipping_address?.country || ''}`, 110, yAddress + (order.shipping_address?.address_line2 ? 25 : 20));

  // --- TABLEAU DES PRODUITS ---
  const tableColumn = ["Désignation", "Qté", "Prix Unit.", "Total"];
  const tableRows: any[] = [];

  order.items?.forEach((item: any) => {
    // Calcul sécurisé
    const price = parseFloat(item.price) || 0;
    const qty = item.quantity || 1;
    const totalLine = price * qty;

    const itemData = [
      item.product_name + (item.variation_name ? ` - ${item.variation_name}` : ''),
      qty,
      `${price.toFixed(2)} €`,
      `${totalLine.toFixed(2)} €`,
    ];
    tableRows.push(itemData);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: yAddress + 35,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [212, 175, 55], // Or
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Désignation
      1: { cellWidth: 20, halign: 'center' }, // Qté
      2: { cellWidth: 30, halign: 'right' }, // PU
      3: { cellWidth: 30, halign: 'right' }, // Total
    },
  });

  // --- TOTAUX (Basés sur la commande) ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  
  const totalAmount = parseFloat(order.total_amount) || 0;
  // Si vous avez les frais de port stockés, ajoutez-les ici. Sinon on suppose que total_amount est le tout.
  
  // Ligne de séparation
  doc.setDrawColor(200);
  doc.line