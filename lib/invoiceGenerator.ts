import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- UTILITAIRES ---
const getPrice = (item: any) => {
  const val = item.price || item.unit_price || 0;
  return parseFloat(val);
};

const getTotal = (order: any) => {
  const val = order.total_amount || order.total || order.amount || 0;
  return parseFloat(val);
};

// Chargeur d'image robuste
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Impossible de créer le contexte 2D"));
            return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(new Error(`Erreur chargement image: ${url}`));
    img.src = url;
  });
};

export const generateInvoicePDF = async (order: any, invoiceNumber: string) => {
  // @ts-ignore - Ignore l'erreur de type sur new jsPDF()
  const doc = new jsPDF();
  
  const primaryColor = "#D4AF37"; // OR
  const blackColor = "#000000";
  
  // --- 1. LOGO BANNIÈRE (HAUT DE PAGE) ---
  let logoLoaded = false;
  try {
    const logoUrl = '/lbdm-logobdc.png';
    const logoData = await loadImage(logoUrl);
    
    // Vérification que c'est bien une image base64 valide
    if (logoData && logoData.startsWith('data:image')) {
        doc.addImage(logoData, 'PNG', 15, 10, 180, 40); 
        logoLoaded = true;
    }
  } catch (error) {
    console.warn("Le logo n'a pas pu être chargé (fallback texte utilisé) :", error);
    logoLoaded = false;
  }

  // Fallback si le logo n'est pas chargé
  if (!logoLoaded) {
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("BOUTIQUE De Morgane", 105, 30, { align: "center" });
  }

  // Position Y de départ après le logo
  let currentY = 60;

  // --- 2. INFORMATIONS VENDEUR (Gauche) ---
  doc.setFontSize(11);
  doc.setTextColor(primaryColor); 
  doc.setFont("helvetica", "bold");
  doc.text("Informations Vendeur", 14, currentY);
  
  doc.setTextColor(blackColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MORGANE DEWANIN", 14, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("SAS (Société par Actions Simplifiée)", 14, currentY + 10);
  doc.text("1062 rue d'Armentières", 14, currentY + 15);
  doc.text("59850 Nieppe, France", 14, currentY + 20);
  doc.text("Email: contact@laboutiquedemorgane.com", 14, currentY + 25);
  doc.text("SIREN: 907 889 802", 14, currentY + 30);
  doc.text("TVA: FR16907889802", 14, currentY + 35);

  // --- 3. BLOC FACTURE & ADRESSE (Droite) ---
  doc.setFontSize(14);
  doc.setTextColor(primaryColor); 
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", 110, currentY);

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.text(`N° ${invoiceNumber}`, 110, currentY + 6);
  doc.setFont("helvetica", "normal");
  
  const today = new Date();
  const dateStr = format(today, 'dd MMMM yyyy', { locale: fr });
  doc.text(`Date : ${dateStr}`, 110, currentY + 11);

  const yAddress = currentY + 20;
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Adresse de Facturation", 110, yAddress);

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.setFont("helvetica", "bold");
  
  const shipAddr = order.shipping_address || {};
  const clientName = `${shipAddr.first_name || ''} ${shipAddr.last_name || ''}`.trim() || "Client";
  doc.text(clientName, 110, yAddress + 6);
  
  doc.setFont("helvetica", "normal");
  const clientCity = `${shipAddr.postal_code || ''} ${shipAddr.city || ''}`.trim();
  
  doc.text(shipAddr.address_line1 || '', 110, yAddress + 11);
  
  let addrOffset = 16;
  if (shipAddr.address_line2) {
    doc.text(shipAddr.address_line2, 110, yAddress + addrOffset);
    addrOffset += 5;
  }
  doc.text(clientCity, 110, yAddress + addrOffset);
  doc.text(shipAddr.country || 'France', 110, yAddress + addrOffset + 5);

  // --- 4. TABLEAU (Fond Doré) ---
  const tableRows: any[] = [];
  const items = order.items || [];
  
  items.forEach((item: any) => {
    const variation = item.variation_name ? `\n(${item.variation_name})` : '';
    const price = getPrice(item); 
    const quantity = item.quantity || 1;
    const totalLine = price * quantity;
    
    tableRows.push([
      (item.product_name || 'Produit') + variation,
      quantity,
      `${price.toFixed(2)} €`,
      `${totalLine.toFixed(2)} €`
    ]);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: 110,
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'grid',
    styles: { 
        fontSize: 10, 
        cellPadding: 3, 
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1
    },
    headStyles: { 
        fillColor: [212, 175, 55], // DORÉ
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
    },
    columnStyles: { 
        0: { cellWidth: 'auto' }, 
        1: { cellWidth: 20, halign: 'center' }, 
        2: { cellWidth: 30, halign: 'right' }, 
        3: { cellWidth: 30, halign: 'right' } 
    }
  });

  // --- 5. TOTAUX ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const xLabel = 140;
  const xValue = 195;
  const totalAmount = getTotal(order); 

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.text("Sous-total :", xLabel, finalY);
  doc.text(`${totalAmount.toFixed(2)} €`, xValue, finalY, { align: 'right' });
  finalY += 8;

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(130, finalY - 4, 195, finalY - 4);
  
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC :", xLabel, finalY);
  doc.text(`${totalAmount.toFixed(2)} €`, xValue, finalY, { align: 'right' });

  // --- 6. PIED DE PAGE ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  
  doc.text("Conditions de paiement : " + (order.payment_method || 'CB / Stripe'), 14, finalY + 20);
  doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, pageHeight - 10, { align: "center" });

  return doc;
};