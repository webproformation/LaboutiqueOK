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
const loadImage = (url: string): Promise<{ data: string; width: number; height: number }> => {
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
        resolve({ data: dataURL, width: img.width, height: img.height });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (e) => reject(new Error(`Erreur chargement image: ${url}`));
    img.src = url;
  });
};

// --- NOUVELLE FONCTION DE NETTOYAGE INTELLIGENTE ---
const parseVariation = (data: any): string[] => {
    const lines: string[] = [];

    if (!data) return lines;

    // Si c'est une string JSON, on parse
    if (typeof data === 'string') {
        try { 
            if (data.startsWith('{') || data.startsWith('[')) {
                data = JSON.parse(data); 
            } else {
                return [data]; // Texte simple
            }
        } catch (e) { return [data]; }
    }

    // Fonction interne pour traiter un objet unique
    const processObject = (obj: any) => {
        // Cas spécifique WooCommerce/Wordpress : { name: "Couleur", option: "Bleu" }
        if (obj.name && obj.option) {
            // On ignore si le nom est générique ou vide, sinon on l'affiche
            const label = obj.name; 
            const value = String(obj.option).toUpperCase(); // On met en majuscule pour simuler le gras
            lines.push(`${label} : ${value}`);
            return;
        }

        // Cas standard : { Taille: "48", Couleur: "Rouge" }
        Object.entries(obj).forEach(([key, value]) => {
            // On ignore les clés techniques ou numériques
            if (key === 'id' || key === 'sku' || !isNaN(Number(key))) return;
            
            // Si la valeur est un objet (ex: sous-structure), on l'ignore ou on l'aplatit
            if (typeof value === 'object') return;

            const valStr = String(value).toUpperCase();
            lines.push(`${key} : ${valStr}`);
        });
    };

    if (Array.isArray(data)) {
        data.forEach(item => processObject(item));
    } else if (typeof data === 'object') {
        processObject(data);
    }

    return lines;
};

export const generateInvoicePDF = async (order: any, invoiceNumber: string) => {
  // @ts-ignore
  const doc = new jsPDF();
  const primaryColor = "#D4AF37"; 
  const blackColor = "#000000";
  
  // --- 1. LOGO ---
  let logoLoaded = false;
  let logoHeightOnPdf = 40;

  try {
    const logoUrl = '/lbdm-logobdc.png'; 
    const imageInfo = await loadImage(logoUrl);
    
    if (imageInfo.data && imageInfo.data.startsWith('data:image')) {
        const pdfLogoWidth = 180; 
        const ratio = imageInfo.height / imageInfo.width;
        logoHeightOnPdf = pdfLogoWidth * ratio;
        if(logoHeightOnPdf > 60) logoHeightOnPdf = 60; // Max hauteur

        doc.addImage(imageInfo.data, 'PNG', 15, 10, pdfLogoWidth, logoHeightOnPdf); 
        logoLoaded = true;
    }
  } catch (error) {
    console.warn("Logo non chargé:", error);
  }

  if (!logoLoaded) {
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("BOUTIQUE De Morgane", 105, 30, { align: "center" });
    logoHeightOnPdf = 30;
  }

  let currentY = 10 + logoHeightOnPdf + 15; 

  // --- 2. INFOS VENDEUR ---
  doc.setFontSize(11);
  doc.setTextColor(primaryColor); 
  doc.setFont("helvetica", "bold");
  doc.text("Informations Vendeur", 14, currentY);
  
  doc.setTextColor(blackColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MORGANE DEWANIN", 14, currentY + 6);
  doc.setFont("helvetica", "normal");
  doc.text("SAS (Société par Actions Simplifiée)", 14, currentY + 11);
  doc.text("1062 rue d'Armentières", 14, currentY + 16);
  doc.text("59850 Nieppe, France", 14, currentY + 21);
  doc.text("Email: contact@laboutiquedemorgane.com", 14, currentY + 26);
  doc.text("SIREN: 907 889 802", 14, currentY + 31);
  doc.text("TVA: FR16907889802", 14, currentY + 36);

  // --- 3. BLOC FACTURE & ADRESSE ---
  const rightColumnX = 110;
  
  doc.setFontSize(16);
  doc.setTextColor(primaryColor); 
  doc.setFont("helvetica", "bold");
  doc.text("FACTURE", rightColumnX, currentY);

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.text(`N° ${invoiceNumber}`, rightColumnX, currentY + 6);
  
  const today = new Date();
  const dateStr = format(today, 'dd MMMM yyyy', { locale: fr });
  doc.setFont("helvetica", "normal");
  doc.text(`Date : ${dateStr}`, rightColumnX, currentY + 11);

  const yAddress = currentY + 25;
  doc.setFontSize(11);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("Adresse de Livraison", rightColumnX, yAddress);

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.setFont("helvetica", "bold");
  
  let shipName = "Client";
  let shipAddr1 = "";
  let shipAddr2 = "";
  let shipCity = "";
  let shipCountry = "France";

  if (order.relay_point_data) {
      shipName = order.relay_point_data.name || "Point Relais";
      shipAddr1 = order.relay_point_data.address || "";
      shipCity = "(Point Relais)";
  } else if (order.shipping_address) {
      shipName = `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim() || "Client";
      shipAddr1 = order.shipping_address.address_line1 || '';
      shipAddr2 = order.shipping_address.address_line2 || '';
      shipCity = `${order.shipping_address.postal_code || ''} ${order.shipping_address.city || ''}`.trim();
      shipCountry = order.shipping_address.country || 'France';
  }

  doc.text(shipName, rightColumnX, yAddress + 6);
  doc.setFont("helvetica", "normal");
  doc.text(shipAddr1, rightColumnX, yAddress + 11);
  
  let addrOffset = 16;
  if (shipAddr2) {
    doc.text(shipAddr2, rightColumnX, yAddress + addrOffset);
    addrOffset += 5;
  }
  if (shipCity) {
      doc.text(shipCity, rightColumnX, yAddress + addrOffset);
      addrOffset += 5;
  }
  doc.text(shipCountry, rightColumnX, yAddress + addrOffset);

  // --- 4. TABLEAU ---
  const tableStartY = Math.max(currentY + 50, yAddress + addrOffset + 15);
  const tableRows: any[] = [];
  const items = order.items || order.order_items || []; 
  
  items.forEach((item: any) => {
    let productName = item.product_name || 'Produit';
    const linesToAdd: string[] = [];

    // 1. Gestion du SKU (Ref) en premier
    // Note : Cela ne s'affichera que si la commande contient bien le SKU en base
    if (item.sku && item.sku !== 'null' && item.sku !== 'undefined') {
        linesToAdd.push(`Ref: ${item.sku}`);
    }

    // 2. Gestion des variations avec la nouvelle logique
    const variationsLines = parseVariation(item.variation_data);
    linesToAdd.push(...variationsLines);

    // 3. Construction finale du texte
    if (linesToAdd.length > 0) {
        productName += `\n${linesToAdd.join('\n')}`;
    }

    const price = getPrice(item); 
    const quantity = item.quantity || 1;
    const totalLine = price * quantity;
    
    tableRows.push([
      productName,
      quantity,
      `${price.toFixed(2)} €`,
      `${totalLine.toFixed(2)} €`
    ]);
  });

  // @ts-ignore
  autoTable(doc, {
    startY: tableStartY,
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'grid',
    styles: { 
        fontSize: 10, 
        cellPadding: 4, 
        textColor: [0, 0, 0], 
        lineColor: [200, 200, 200], 
        lineWidth: 0.1, 
        valign: 'top' // Alignement haut pour que la Ref soit bien visible
    },
    headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: { 
        0: { cellWidth: 'auto' }, 
        1: { cellWidth: 20, halign: 'center' }, 
        2: { cellWidth: 30, halign: 'right' }, 
        3: { cellWidth: 30, halign: 'right' } 
    },
  });

  // --- 5. TOTAUX ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  if (finalY > 250) { doc.addPage(); finalY = 20; }

  const xLabel = 140;
  const xValue = 195;
  const subTotal = typeof order.subtotal === 'number' ? order.subtotal : parseFloat(order.subtotal || 0);
  const shipping = typeof order.shipping_cost === 'number' ? order.shipping_cost : parseFloat(order.shipping_cost || 0);
  const discount = typeof order.discount_amount === 'number' ? order.discount_amount : parseFloat(order.discount_amount || 0);
  const total = typeof order.total === 'number' ? order.total : parseFloat(order.total || 0);

  doc.setFontSize(10);
  doc.setTextColor(blackColor);
  doc.text("Sous-total :", xLabel, finalY);
  doc.text(`${subTotal.toFixed(2)} €`, xValue, finalY, { align: 'right' });
  finalY += 6;

  if (shipping > 0) {
      doc.text("Livraison :", xLabel, finalY);
      doc.text(`${shipping.toFixed(2)} €`, xValue, finalY, { align: 'right' });
      finalY += 6;
  }

  if (discount > 0) {
      doc.setTextColor(0, 150, 0); 
      doc.text("Réduction :", xLabel, finalY);
      doc.text(`-${discount.toFixed(2)} €`, xValue, finalY, { align: 'right' });
      finalY += 6;
      doc.setTextColor(blackColor);
  }

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(130, finalY - 2, 195, finalY - 2);
  finalY += 4;
  
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL TTC :", xLabel, finalY);
  doc.text(`${total.toFixed(2)} €`, xValue, finalY, { align: 'right' });

  // --- 6. PIED DE PAGE ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  
  let paymentText = order.payment_method_name || 'Carte Bancaire';
  if (order.payment_method && typeof order.payment_method === 'string') paymentText = order.payment_method;
  
  doc.text(`Mode de paiement : ${paymentText}`, 14, finalY + 15);
  doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, pageHeight - 10, { align: "center" });

  return doc;
};