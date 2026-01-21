import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- UTILITAIRES ---
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

// --- DÉCODEUR INTELLIGENT (Pour lire vos données Supabase nichées) ---
const formatVariationLines = (data: any): string[] => {
    const lines: string[] = [];
    if (!data) return lines;

    let obj = data;
    if (typeof data === 'string') {
        try { obj = JSON.parse(data); } catch (e) { return [data]; }
    }

    // On parcourt chaque propriété (ex: "tailles", "couleurs-principales")
    Object.entries(obj).forEach(([key, val]: [string, any]) => {
        const k = key.toLowerCase();
        // On ignore les identifiants techniques et le SKU (traité à part)
        if (k.includes('id') || k === 'sku' || !isNaN(Number(key))) return;

        // 1. Nettoyage du Label (ex: "couleurs-principales" -> "Couleur")
        let label = key;
        if (k.includes('couleur')) label = 'Couleur';
        else if (k.includes('taille')) label = 'Taille';
        else label = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');

        // 2. Extraction de la Valeur (C'est ici que ça bloquait avant !)
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
  
  // 1. LOGO (Pleine largeur comme avant)
  let logoH = 35;
  try {
    const imgInfo = await loadImage('/lbdm-logobdc.png');
    const pdfW = 180;
    logoH = Math.min(pdfW * (imgInfo.height / imgInfo.width), 45);
    doc.addImage(imgInfo.data, 'PNG', 15, 10, pdfW, logoH);
  } catch (e) { logoH = 15; }

  let currentY = 10 + logoH + 15;

  // 2. BLOCS VENDEUR & FACTURE
  doc.setFontSize(10);
  doc.setTextColor(primaryColor); doc.setFont("helvetica", "bold");
  doc.text("Informations Vendeur", 14, currentY);
  doc.text("FACTURE", 110, currentY);

  doc.setTextColor(blackColor); doc.setFont("helvetica", "normal");
  doc.text([
    "MORGANE DEWANIN",
    "1062 rue d'Armentières",
    "59850 Nieppe, France",
    "Email: contact@laboutiquedemorgane.com",
    "SIREN: 907 889 802",
    "TVA: FR16907889802"
  ], 14, currentY + 6);

  doc.text([
    `N° ${invoiceNumber}`,
    `Date : ${format(new Date(order.created_at || new Date()), 'dd MMMM yyyy', { locale: fr })}`
  ], 110, currentY + 6);

  // 3. ADRESSE DE LIVRAISON
  currentY += 40;
  doc.setTextColor(primaryColor); doc.setFont("helvetica", "bold");
  doc.text("Adresse de Livraison", 110, currentY);
  doc.setTextColor(blackColor); doc.setFont("helvetica", "normal");
  
  const ship = order.relay_point_data || order.shipping_address || {};
  let addrLines = [];
  
  if (order.relay_point_data) {
      addrLines = [
          ship.name || "Point Relais",
          ship.address || "",
          "France (POINT RELAIS)"
      ];
  } else {
      addrLines = [
        `${ship.first_name || ''} ${ship.last_name || ''}`.trim(),
        ship.address_line1 || '',
        ship.address_line2 || '',
        `${ship.postal_code || ''} ${ship.city || ''}`.trim(),
        ship.country || 'France'
      ].filter(l => l !== '');
  }
  doc.text(addrLines, 110, currentY + 6);

  // 4. TABLEAU DES PRODUITS
  const items = order.items || order.order_items || [];
  const tableRows = items.map((item: any) => {
    let productName = item.product_name || 'Produit';
    const subLines: string[] = [];

    // A. Récupération du SKU (Ref)
    const cleanSku = String(item.sku || "").trim();
    if (cleanSku && cleanSku !== 'null' && cleanSku !== 'undefined') {
        subLines.push(`Ref : ${cleanSku.toUpperCase()}`);
    }

    // B. Récupération des Variations (Couleur/Taille) via le décodeur
    const vars = formatVariationLines(item.variation_data);
    subLines.push(...vars);

    if (subLines.length > 0) productName += "\n" + subLines.join("\n");

    const p = parseFloat(item.price || item.unit_price || 0);
    const q = item.quantity || 1;
    return [productName, q, `${p.toFixed(2)} €`, `${(p * q).toFixed(2)} €`];
  });

  // @ts-ignore
  autoTable(doc, {
    startY: currentY + 45,
    head: [["Produit", "Qté", "Prix Unit.", "Total"]],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'top' },
    headStyles: { fillColor: [212, 175, 55], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 25, halign: 'right' }, 3: { cellWidth: 25, halign: 'right' } }
  });

  // 5. TOTAUX & PAIEMENT (Partie Riche restaurée)
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  
  // Affichage du mode de paiement
  doc.setFontSize(9); doc.setTextColor(blackColor);
  let payMethod = order.payment_method_name || order.payment_method || 'Carte Bancaire';
  // Nettoyage si c'est un ID brut
  if (payMethod.includes('_')) payMethod = payMethod.replace(/_/g, ' ').toUpperCase();
  doc.text(`Mode de paiement : ${payMethod}`, 14, finalY);

  const drawTotal = (label: string, val: string, y: number, color = blackColor, bold = false) => {
    doc.setFontSize(10); doc.setTextColor(color);
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
  
  // On affiche toujours la livraison pour clarté
  drawTotal("Livraison :", `${shipCost.toFixed(2)} €`, finalY += 6);
  
  if (insurance > 0) drawTotal("Assurance :", `${insurance.toFixed(2)} €`, finalY += 6);
  if (discount > 0) drawTotal("Réduction :", `-${discount.toFixed(2)} €`, finalY += 6, [0, 150, 0]);
  if (wallet > 0) drawTotal("Cagnotte :", `-${wallet.toFixed(2)} €`, finalY += 6, primaryColor);
  
  doc.setDrawColor(200); doc.line(130, finalY + 2, 195, finalY + 2);
  drawTotal("TOTAL TTC :", `${total.toFixed(2)} €`, finalY += 8, primaryColor, true);

  // 6. PIED DE PAGE
  doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
  doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, 285, { align: "center" });

  return doc;
};