import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@supabase/supabase-js";

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
        .select(`
          *,
          shipping_method:shipping_methods(name),
          payment_method:payment_methods(name)
        `)
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

    // --- 2. CRÉATION DU PDF ---
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const goldColor = "#b8933d"; // Couleur Or de la charte

    // --- EN-TÊTE ---
    // Logo / Titre Principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(goldColor);
    doc.text("BOUTIQUE", 15, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0); // Noir
    doc.text("De Morgane", 60, 20);

    // Sous-titres
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SHOPPING EN LIVE DEPUIS 2020", 15, 26);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100); // Gris
    doc.text("Votre dose de style et de joie", 15, 31);

    // Titre "BON DE COMMANDE"
    doc.setFillColor(245, 245, 245); // Fond gris très clair
    doc.roundedRect(120, 10, 75, 25, 2, 2, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("BON DE COMMANDE", 157.5, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`N° ${order.order_number}`, 157.5, 27, { align: "center" });
    
    const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFont("helvetica", "normal");
    doc.text(`Date : ${orderDate}`, 157.5, 32, { align: "center" });

    // --- COLONNES INFO (Vendeur / Acheteur) ---
    const startY = 50;
    
    // Colonne Gauche : VENDEUR
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("Informations Vendeur", 15, startY);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let sellerY = startY + 6;
    SELLER_INFO.forEach(line => {
      doc.text(line, 15, sellerY);
      sellerY += 4.5;
    });

    // Colonne Droite : LIVRAISON
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("Adresse de Livraison", 110, startY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    // Construction de l'adresse
    const ship = order.shipping_address || {};
    const name = `${ship.first_name || ''} ${ship.last_name || ''}`.trim() || "Client Inconnu";
    const address1 = ship.address_line1 || ship.street || "";
    const address2 = ship.address_line2 || "";
    const city = `${ship.postal_code || ''} ${ship.city || ''}`.trim();
    const country = ship.country || "France";
    const phone = ship.phone || "";
    const email = order.user_email || ""; // Si dispo dans l'objet order

    let buyerY = startY + 6;
    doc.text(name, 110, buyerY); buyerY += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (address1) { doc.text(address1, 110, buyerY); buyerY += 4.5; }
    if (address2) { doc.text(address2, 110, buyerY); buyerY += 4.5; }
    doc.text(city, 110, buyerY); buyerY += 4.5;
    doc.text(country, 110, buyerY); buyerY += 6;
    
    if (phone) { doc.text(`Tél: ${phone}`, 110, buyerY); buyerY += 4.5; }
    if (email) { doc.text(email, 110, buyerY); }

    // --- TABLEAU DES PRODUITS ---
    const tableRows = (order.order_items || []).map((item: any) => {
      // Préparation de la description
      let details = item.product_name;
      const variations = [];
      if (item.variation_data) {
         // Gestion des variations (texte simple pour éviter surcharge)
         const attrs = item.variation_data.attributes || item.variation_data;
         if (Array.isArray(attrs)) {
            attrs.forEach((a: any) => variations.push(`${a.name}: ${a.option}`));
         } else if (typeof attrs === 'object') {
            Object.entries(attrs).forEach(([k, v]) => {
                if(!k.includes('_') && k !== 'price') variations.push(`${k}: ${v}`);
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
      startY: 115,
      head: [["Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableRows,
      theme: 'plain', // Style épuré comme le modèle
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        lineWidth: { bottom: 0.5 },
        lineColor: [200, 200, 200]
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: { 
        0: { cellWidth: 'auto' }, 
        1: { cellWidth: 20, halign: 'center' }, 
        2: { halign: 'right' }, 
        3: { halign: 'right', fontStyle: 'bold' } 
      },
      didDrawPage: (data) => {
          // Ajout des lignes horizontales manuelles si besoin, 
          // mais 'theme: plain' + headStyles suffit souvent pour le look "Facture moderne"
      }
    });

    // --- TOTAUX ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const rightColX = 140; // Alignement des chiffres
    const labelX = 130;    // Alignement des libellés
    
    const subtotal = Number(order.subtotal || order.total_amount || 0);
    const shipping = Number(order.shipping_cost || 0);
    const discount = Number(order.discount_amount || 0);
    const total = Number(order.total || 0);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Sous-total
    doc.text("Sous-total :", labelX, finalY, { align: "right" });
    doc.text(`${subtotal.toFixed(2)} €`, 195, finalY, { align: "right" });

    // Livraison
    doc.text("Frais de port :", labelX, finalY + 6, { align: "right" });
    doc.text(`${shipping.toFixed(2)} €`, 195, finalY + 6, { align: "right" });

    // Remise (si existe)
    if (discount > 0) {
        doc.setTextColor(200, 0, 0); // Rouge pour la remise
        doc.text("Remise :", labelX, finalY + 12, { align: "right" });
        doc.text(`- ${discount.toFixed(2)} €`, 195, finalY + 12, { align: "right" });
        doc.setTextColor(0, 0, 0);
    }

    // Ligne de séparation
    const totalLineY = discount > 0 ? finalY + 16 : finalY + 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(110, totalLineY, 195, totalLineY);

    // TOTAL TTC
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(goldColor);
    doc.text("TOTAL TTC :", labelX, totalLineY + 8, { align: "right" });
    doc.text(`${total.toFixed(2)} €`, 195, totalLineY + 8, { align: "right" });

    // Info paiement
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const payMethod = order.payment_method?.name || order.payment_status || "Non spécifié";
    doc.text(`Mode de paiement : ${payMethod}`, 15, totalLineY + 8);

    // --- PIED DE PAGE (MENTIONS LÉGALES) ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    
    const footerY = pageHeight - 20;
    doc.text("Conformément à la loi n°78-17 du 6 janvier 1978, vous disposez d'un droit d'accès, de modification, de rectification et de suppression des données vous concernant.", 105, footerY, { align: "center" });
    doc.text("En cas de litige, seuls les tribunaux français seront compétents. Garantie légale de conformité et des vices cachés applicable.", 105, footerY + 4, { align: "center" });
    doc.text("MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802", 105, footerY + 8, { align: "center" });

    // --- ENVOI DE LA RÉPONSE ---
    const pdfDataUri = doc.output('datauristring');
    const pdfBase64 = pdfDataUri.split(',')[1];

    return NextResponse.json({ pdfBase64, filename: `Commande_${order.order_number}.pdf` });

  } catch (error: any) {
    console.error("PDF Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}