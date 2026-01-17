import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { promises as fs } from "fs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// --- INFOS VENDEUR (CONSTANTES) ---
const SELLER_INFO = [
  "MORGANE DEWANIN",
  "SAS (Société par Actions Simplifiée)",
  "1062 rue d'Armentières",
  "59850 Nieppe, France",
  "Tél: +33 6 41 45 66 71",
  "Email: contact@laboutiquedemorgane.com",
  "SIREN: 907 889 802",
  "SIRET: 907 889 802 00027",
  "TVA: FR16907889802",
  "APE: 4641Z"
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let order = body.order;
    const orderId = body.orderId;

    // 1. RÉCUPÉRATION ROBUSTE DES DONNÉES
    if (!order && orderId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
        
      if (orderError || !orderData) {
        console.error("Erreur Fetch Commande:", orderError);
        throw new Error("Commande introuvable dans la base");
      }

      order = orderData;

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      
      order.order_items = itemsData || [];

      // Infos complémentaires manuelles
      if (order.shipping_method_id) {
        const { data: shipData } = await supabase
          .from("shipping_methods")
          .select("name").eq("id", order.shipping_method_id).single();
        if (shipData) order.shipping_method = shipData;
      }
      if (order.payment_method_id) {
        const { data: payData } = await supabase
          .from("payment_methods")
          .select("name").eq("id", order.payment_method_id).single();
        if (payData) order.payment_method = payData;
      }
    }

    if (!order) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

    // --- 2. PRÉPARATION DES RESSOURCES (LOGO) ---
    let logoBase64 = null;
    try {
      // On cherche l'image dans le dossier public
      const logoPath = path.join(process.cwd(), 'public', 'lbdm-logobdc copy.png');
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = logoBuffer.toString('base64');
    } catch (err) {
      console.warn("Logo introuvable, génération sans logo:", err);
    }

    // --- 3. GÉNÉRATION DU PDF ---
    const doc = new jsPDF();
    const goldColor = "#b8933d"; // Couleur Or Charte
    const goldRGB: [number, number, number] = [184, 147, 61]; // Conversion RGB pour autoTable

    // --- EN-TÊTE ---
    if (logoBase64) {
      // Ajout du logo (Position X, Y, Largeur, Hauteur) - Ajustez les dimensions si besoin
      doc.addImage(logoBase64, 'PNG', 10, 10, 190, 45); 
    } else {
      // Fallback si l'image n'est pas trouvée
      doc.setFontSize(20);
      doc.setTextColor(goldColor);
      doc.text("BOUTIQUE DE MORGANE", 105, 30, { align: "center" });
    }

    // Bloc "BON DE COMMANDE"
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(120, 60, 75, 25, 2, 2, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("BON DE COMMANDE", 157.5, 70, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`N° ${order.order_number}`, 157.5, 77, { align: "center" });
    
    const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${orderDate}`, 157.5, 82, { align: "center" });

    // --- COLONNES INFO ---
    const startY = 95;
    
    // Vendeur
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("Informations Vendeur", 15, startY);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    let sellerY = startY + 6;
    
    SELLER_INFO.forEach(line => {
      // Mise en gras spécifique pour "MORGANE DEWANIN"
      if (line === "MORGANE DEWANIN") {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }
      doc.text(line, 15, sellerY);
      sellerY += 4.5;
    });

    // Acheteur
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("Adresse de Livraison", 110, startY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    const ship = order.shipping_address || {};
    const name = `${ship.first_name || ''} ${ship.last_name || ''}`.trim() || "Client";
    const address1 = ship.address_line1 || ship.street || "";
    const address2 = ship.address_line2 || "";
    const city = `${ship.postal_code || ''} ${ship.city || ''}`.trim();
    const country = ship.country || "France";
    const phone = ship.phone || "";
    const email = order.user_email || "";

    let buyerY = startY + 6;
    doc.text(name, 110, buyerY); buyerY += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (address1) { doc.text(address1, 110, buyerY); buyerY += 4.5; }
    if (address2) { doc.text(address2, 110, buyerY); buyerY += 4.5; }
    doc.text(city, 110, buyerY); buyerY += 4.5;
    doc.text(country, 110, buyerY); buyerY += 6;
    if (phone) { doc.text(`Tél: ${phone}`, 110, buyerY); }

    // --- TABLEAU ---
    const tableRows = (order.order_items || []).map((item: any) => {
      let details = item.product_name;
      const variations: string[] = [];
      if (item.variation_data) {
         const attrs = item.variation_data.attributes || item.variation_data;
         if (Array.isArray(attrs)) {
            attrs.forEach((a: any) => variations.push(`${a.name}: ${a.option}`));
         } else if (typeof attrs === 'object') {
            Object.entries(attrs).forEach(([k, v]) => {
                if(!k.includes('_') && k !== 'price' && k !== 'id') {
                    const valStr = typeof v === 'object' ? (v as any).name || (v as any).option : String(v);
                    variations.push(`${k}: ${valStr}`);
                }
            });
         }
      }
      if (variations.length > 0) details += `\n(${variations.join(', ')})`;

      return [
        details,
        item.quantity,
        `${Number(item.price).toFixed(2)} €`,
        `${(item.quantity * item.price).toFixed(2)} €`
      ];
    });

    autoTable(doc, {
      startY: 155, // Descendu pour laisser place au logo
      head: [["Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableRows,
      theme: 'grid', // 'grid' permet de bien voir les fonds de couleur
      headStyles: { 
        fillColor: goldRGB, // COULEUR OR CHARTE (#b8933d)
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      columnStyles: { 
        0: { cellWidth: 'auto' }, 
        1: { cellWidth: 20, halign: 'center' }, 
        2: { halign: 'right' }, 
        3: { halign: 'right', fontStyle: 'bold' } 
      }
    });

    // --- TOTAUX ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const labelX = 130;
    
    const subtotal = Number(order.subtotal || order.total_amount || 0);
    const shipping = Number(order.shipping_cost || 0);
    const discount = Number(order.discount_amount || 0);
    const total = Number(order.total || 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text("Sous-total :", labelX, finalY, { align: "right" });
    doc.text(`${subtotal.toFixed(2)} €`, 195, finalY, { align: "right" });

    doc.text("Frais de port :", labelX, finalY + 6, { align: "right" });
    doc.text(`${shipping.toFixed(2)} €`, 195, finalY + 6, { align: "right" });

    if (discount > 0) {
        doc.setTextColor(200, 0, 0);
        doc.text("Remise :", labelX, finalY + 12, { align: "right" });
        doc.text(`- ${discount.toFixed(2)} €`, 195, finalY + 12, { align: "right" });
        doc.setTextColor(0, 0, 0);
    }

    const totalLineY = discount > 0 ? finalY + 16 : finalY + 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(110, totalLineY, 195, totalLineY);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("TOTAL TTC :", labelX, totalLineY + 8, { align: "right" });
    doc.text(`${total.toFixed(2)} €`, 195, totalLineY + 8, { align: "right" });

    // Paiement & Mentions
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const payMethod = order.payment_method?.name || order.payment_status || "Non spécifié";
    doc.text(`Mode de paiement : ${payMethod}`, 15, totalLineY + 8);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const footerY = pageHeight - 20;
    doc.text("Conformément à la loi n°78-17 du 6 janvier 1978...", 105, footerY, { align: "center" });
    doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802", 105, footerY + 8, { align: "center" });

    const pdfDataUri = doc.output('datauristring');
    const pdfBase64 = pdfDataUri.split(',')[1];

    return NextResponse.json({ pdfBase64, filename: `Commande_${order.order_number}.pdf` });

  } catch (error: any) {
    console.error("PDF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}