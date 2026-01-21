import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const loadImage = (url: string): Promise<{ data: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; 
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Canvas error"));
      ctx.drawImage(img, 0, 0);
      resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error(`Erreur image: ${url}`));
    img.src = url;
  });
};

// --- LA FONCTION MAGIQUE POUR VOS ATTRIBUTS ---
const formatVariationLines = (data: any): string[] => {
    const lines: string[] = [];
    if (!data) return lines;

    let obj = data;
    if (typeof data === 'string') {
        try { obj = JSON.parse(data); } catch (e) { return [data]; }
    }

    // On parcourt chaque clé (ex: "tailles", "couleurs-principales")
    Object.entries(obj).forEach(([key, val]: [string, any]) => {
        const k = key.toLowerCase();
        if (k.includes('id') || k === 'sku' || !isNaN(Number(key))) return;

        // 1. On nettoie le nom de l'étiquette
        let label = key;
        if (k.includes('couleur')) label = 'Couleur';
        else if (k.includes('taille')) label = 'Taille';
        else label = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

        // 2. On cherche la valeur (.name est crucial pour votre SQL !)
        let displayVal = "";
        if (val && typeof val === 'object') {
            displayVal = val.name || val.value || val.option || val.label || "";
        } else {
            displayVal = String(val);
        }

        if (displayVal && displayVal !== 'undefined' && displayVal.trim() !== "") {
            lines.push(`${label} : ${displayVal.toUpperCase()}`);
        }
    });

    return lines;
};

export const generateInvoicePDF = async (order: any, invoiceNumber: string) => {
  // @ts-ignore
  const doc = new jsPDF();
  const primaryColor = "#D4AF37"; 
  const blackColor = "#000000";
  
  // 1. LOGO
  let logoH = 35;
  try {
    const imgInfo = await loadImage('/lbdm-logobdc.png');
    const pdfW = 180;
    logoH = Math.min(pdfW * (imgInfo.height / imgInfo.width), 45);
    doc.addImage(imgInfo.data, 'PNG', 15, 10, pdfW, logoH);
  } catch (e) { logoH = 15; }

  let currentY = 10 + logoH + 15;

  // 2. EN-TÊTE
  doc.setFontSize(10);
  doc.setTextColor(primaryColor); doc.setFont("helvetica", "bold");
  doc.text("Informations Vendeur", 14, currentY);
  doc.text("FACTURE", 110, currentY);

  doc.setTextColor(blackColor); doc.setFont("helvetica", "normal");
  doc.text(["MORGANE DEWANIN", "1062 rue d'Armentières", "59850 Nieppe", "TVA: FR16907889802"], 14, currentY + 6);
  doc.text([`N° ${invoiceNumber}`, `Date : ${format(new Date(order.created_at || new Date()), 'dd MMMM yyyy', { locale: fr })}`], 110, currentY + 6);

  // 3. ADRESSE
  currentY += 30;
  doc.setTextColor(primaryColor); doc.setFont("helvetica", "bold");
  doc.text("Adresse de Livraison", 110, currentY);
  doc.setTextColor(blackColor); doc.setFont("helvetica", "normal");
  
  const ship = order.relay_point_data || order.shipping_address || {};
  const addrLines = order.relay_point_data 
    ? [ship.name, ship.address, "France (POINT RELAIS)"]
    : [`${ship.first_name || ''} ${ship.last_name || ''}`, ship.address_line1, `${ship.postal_code || ''} ${ship.city || ''}`, ship.country || 'France'];
  doc.text(addrLines, 110, currentY + 6);

  // 4. TABLEAU
  const items = order.items || order.order_items || [];
  const tableRows = items.map((item: any) => {
    let productName = item.product_name || 'Produit';
    const subLines: string[] = [];

    // --- REF (SKU) ---
    const cleanSku = String(item.sku || "").trim();
    if (cleanSku && cleanSku !== 'null' && cleanSku !== 'undefined' && cleanSku !== '') {
        subLines.push(`Ref : ${cleanSku.toUpperCase()}`);
    }

    // --- VARIATIONS ---
    const vars = formatVariationLines(item.variation_data);
    subLines.push(...vars);

    if (subLines.length > 0) productName += "\n" + subLines.join("\n");

    const p = parseFloat(item.price || 0);
    const q = item.quantity || 1;
    return [productName, q, `${p.toFixed(2)} €`, `${(p * q).toFixed(2)} €`];
  });

  // @ts-ignore
  autoTable(doc, {
    startY: currentY + 35,
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'top' },
    headStyles: { fillColor: [212, 175, 55], textColor: 255 },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 25, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' } }
  });

  // 5. TOTAUX
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  const drawTotal = (label: string, val: string, y: number, color = blackColor, size = 10) => {
    doc.setFontSize(size); doc.setTextColor(color);
    doc.text(label, 140, y);
    doc.text(val, 195, y, { align: 'right' });
  };

  drawTotal("Sous-total :", `${parseFloat(order.subtotal || 0).toFixed(2)} €`, finalY);
  if (parseFloat(order.shipping_cost || 0) > 0) drawTotal("Livraison :", `${parseFloat(order.shipping_cost || 0).toFixed(2)} €`, finalY += 6);
  if (parseFloat(order.discount_amount || 0) > 0) drawTotal("Réduction :", `-${parseFloat(order.discount_amount || 0).toFixed(2)} €`, finalY += 6, [0, 150, 0]);
  
  doc.setDrawColor(200); doc.line(130, finalY + 2, 195, finalY + 2);
  drawTotal("TOTAL TTC :", `${parseFloat(order.total || 0).toFixed(2)} €`, finalY += 8, primaryColor, 12);

  doc.setFontSize(8); doc.setTextColor(150);
  doc.text("MORGANE DEWANIN - SIREN 907 889 802 - TVA FR16907889802", 105, 285, { align: "center" });

  return doc;
};