import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();

    if (!order) {
      return NextResponse.json({ error: "Order data missing" }, { status: 400 });
    }

    const doc = new jsPDF();
    
    // --- 1. HEADER AVEC LOGO CORRIGÉ ---
    // Fond noir en haut
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, "F");

    // Gestion du Logo (Si présent en base64 ou URL publique)
    // Note: Pour jsPDF côté serveur, l'idéal est d'avoir l'image en Base64 ou URL absolue
    // Ici on met un placeholder texte stylé si l'image manque, ou l'image si vous l'avez injectée
    doc.setTextColor(212, 175, 55); // Or (#d4af37)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("LA BOUTIQUE DE MORGANE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Shopping en live & bonne humeur", 105, 28, { align: "center" });

    // --- 2. INFOS COMMANDE ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("BON DE COMMANDE", 105, 55, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Commande N° ${order.order_number}`, 105, 62, { align: "center" });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 105, 67, { align: "center" });

    // --- 3. TABLEAU PRODUITS AMÉLIORÉ (SKU + VARIATIONS) ---
    const tableRows = order.order_items.map((item: any) => {
      // Construction du texte produit riche
      let productDetails = item.product_name;
      
      // Ajout du SKU/UGS
      if (item.sku) {
        productDetails += `\nUGS: ${item.sku}`;
      }
      
      // Ajout des variations (Taille, Couleur)
      if (item.variation_text) {
        productDetails += `\n${item.variation_text}`; // Ex: "Taille: L, Couleur: Bleu"
      }

      return [
        productDetails,
        item.quantity,
        `${Number(item.price).toFixed(2)} €`,
        `${(item.quantity * item.price).toFixed(2)} €`
      ];
    });

    autoTable(doc, {
      startY: 80,
      head: [["Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] }, // Entête Or
      styles: { cellPadding: 3, fontSize: 10, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Produit (large)
        1: { cellWidth: 20, halign: 'center' }, // Qté
        2: { cellWidth: 30, halign: 'right' }, // Prix
        3: { cellWidth: 30, halign: 'right' }  // Total
      }
    });

    // --- 4. TOTAUX ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(11);
    doc.text(`Sous-total : ${Number(order.total_amount).toFixed(2)} €`, 190, finalY, { align: "right" });
    doc.text(`Livraison : ${Number(order.shipping_cost || 0).toFixed(2)} €`, 190, finalY + 7, { align: "right" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55); // Or
    doc.text(`TOTAL : ${Number(order.total_amount).toFixed(2)} €`, 190, finalY + 16, { align: "right" });

    // Encodage en Base64
    const pdfOutput = doc.output("datauristring").split(",")[1];

    return NextResponse.json({ pdfBase64: pdfOutput, filename: `Commande_${order.order_number}.pdf` });

  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}