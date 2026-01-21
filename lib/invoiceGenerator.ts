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

// --- DÉCODEUR MAGIQUE (Compatible avec vos objets SQL imbriqués) ---
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
        // On ignore les clés techniques
        if (k.includes('id') || k === 'sku' || !isNaN(Number(key))) return;

        // 1. Traduction du Label
        let label = key;
        if (k.includes('couleur')) label = 'Couleur';
        else if (k.includes('taille')) label = 'Taille';
        else label = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

        // 2. Extraction de la Valeur (C'est là que ça bloquait avant)
        let displayVal = "";
        // Si c'est un objet (ex: {"name": "Bleu", "id": "..."}), on prend le .name
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
  doc.text(["MORGANE DEWANIN", "1062 rue d'Armentières", "59850 Nieppe, France", "TVA: FR16907889802"], 14, currentY + 6);
  doc.text([`N° ${invoiceNumber}`, `Date : ${format(new Date(order.created_at || new Date()), 'dd MMMM yyyy', { locale: fr })}`], 110, currentY + 6);

  // 3. ADRESSE
  currentY += 30;
  doc.setTextColor(primaryColor); doc.setFont("helvetica", "bold");
  doc.text("Adresse de Livraison", 110, currentY);
  doc.setTextColor(blackColor); doc.setFont("helvetica", "normal");
  
  const ship = order.relay_point_data || order.shipping_address || {};
  let addrLines = [];
  if (order.relay_point_data) {
      addrLines = [ship.name, ship.address, "France (POINT RELAIS)"];
  } else {
      addrLines = [
        `${ship.first_name || ''} ${ship.last_name || ''}`,
        ship.address_line1,
        ship.address_line2 || '',
        `${ship.postal_code || ''} ${ship.city || ''}`,
        ship.country || 'France'
      ].filter(l => l !== '');
  }
  doc.text(addrLines, 110, currentY + 6);

  // 4. TABLEAU
  const items = order.items || order.order_items || [];
  const tableRows = items.map((item: any) => {
    let productName = item.product_name || 'Produit';
    const subLines: string[] = [];

    // REF (SKU)
    const cleanSku = String(item.sku || "").trim();
    if (cleanSku && cleanSku !== 'null' && cleanSku !== 'undefined' && cleanSku !== '') {
        subLines.push(`Ref : ${cleanSku.toUpperCase()}`);
    }

    // VARIATIONS
    const vars = formatVariationLines(item.variation_data);
    subLines.push(...vars);

    if (subLines.length > 0) productName += "\n" + subLines.join("\n");

    const p = parseFloat(item.price || 0);
    const q = item.quantity || 1;
    return [productName, q, `${p.toFixed(2)} €`, `${(p * q).toFixed(2)} €`];
  });

  // @ts-ignore
  autoTable(doc, {
    startY: currentY + 40,
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'top' },
    headStyles: { fillColor: [212, 175, 55], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 25, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' } }
  });

  // 5. MODE DE PAIEMENT & TOTAUX
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(9); doc.setTextColor(blackColor);
  let payMethod = order.payment_method_name || order.payment_method || 'Carte Bancaire';
  doc.text(`Mode de paiement : ${payMethod}`, 14, finalY);

  const drawTotal = (label: string, val: string, y: number, color = blackColor, size = 10, bold = false) => {
    doc.setFontSize(size); doc.setTextColor(color);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, 140, y);
    doc.text(val, 195, y, { align: 'right' });
  };

  const subTotal = parseFloat(order.subtotal || 0);
  const shipCost = parseFloat(order.shipping_cost || 0);
  const insurance = parseFloat(order.insurance_cost || 0);
  const discount = parseFloat(order.discount_amount || 0);
  const wallet = parseFloat(order.wallet_amount_used || 0);
  const total = parseFloat(order.total || 0);

  drawTotal("Sous-total :", `${subTotal.toFixed(2)} €`, finalY);
  drawTotal("Livraison :", `${shipCost.toFixed(2)} €`, finalY += 6);
  
  if (insurance > 0) drawTotal("Assurance :", `${insurance.toFixed(2)} €`, finalY += 6);
  if (discount > 0) drawTotal("Réduction :", `-${discount.toFixed(2)} €`, finalY += 6, [0, 150, 0]);
  if (wallet > 0) drawTotal("Cagnotte :", `-${wallet.toFixed(2)} €`, finalY += 6, primaryColor);
  
  doc.setDrawColor(200); doc.line(130, finalY + 2, 195, finalY + 2);
  drawTotal("TOTAL TTC :", `${total.toFixed(2)} €`, finalY += 8, primaryColor, 12, true);

  // 6. PIED DE PAGE
  doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
  doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, 285, { align: "center" });

  return doc;
};