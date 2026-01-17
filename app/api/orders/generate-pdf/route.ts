import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let order = body.order;
    const orderId = body.orderId;

    // PROTECTION : Récupération de la commande si on n'a que l'ID
    if (!order && orderId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
        
      if (orderError || !orderData) throw new Error("Commande introuvable");

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      order = { ...orderData, order_items: itemsData || [] };
    }

    if (!order) {
      return NextResponse.json({ error: "Order data missing" }, { status: 400 });
    }

    // --- GÉNÉRATION DU PDF ---
    const doc = new jsPDF();
    
    // Header Noir et Or
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("LA BOUTIQUE DE MORGANE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Shopping en live & bonne humeur", 105, 28, { align: "center" });

    // Infos Commande
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("BON DE COMMANDE", 105, 55, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Commande N° ${order.order_number}`, 105, 62, { align: "center" });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 105, 67, { align: "center" });

    // Tableau Produits
    const tableRows = (order.order_items || []).map((item: any) => {
      let details = item.product_name;
      if (item.sku) details += `\nUGS: ${item.sku}`;
      if (item.variation_text) details += `\n${item.variation_text}`;

      return [
        details,
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
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 20, halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    });

    // Totaux
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const total = Number(order.total_amount || 0);
    const shipping = Number(order.shipping_cost || 0);

    doc.setFontSize(11);
    doc.text(`Sous-total : ${(total - shipping).toFixed(2)} €`, 190, finalY, { align: "right" });
    doc.text(`Livraison : ${shipping.toFixed(2)} €`, 190, finalY + 7, { align: "right" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.text(`TOTAL : ${total.toFixed(2)} €`, 190, finalY + 16, { align: "right" });

    // METHODE SURE : On récupère la chaine Data URI complète et on extrait le Base64
    const pdfDataUri = doc.output('datauristring');
    const pdfBase64 = pdfDataUri.split(',')[1];

    return NextResponse.json({ pdfBase64, filename: `Commande_${order.order_number}.pdf` });

  } catch (error: any) {
    console.error("PDF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}