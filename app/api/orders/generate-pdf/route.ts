import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as fs from "fs";
import * as path from "path";
import { formatAttributes } from "@/lib/utils";

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID requis" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    // Enrichir les items avec les infos produit et variation
    const enrichedItems = await Promise.all(
      (orderItems || []).map(async (item: any) => {
        const { data: product } = await supabase
          .from("products")
          .select("sku, image_url")
          .eq("id", item.product_id)
          .maybeSingle();

        let variationImage = null;
        if (item.variation_id) {
          const { data: variation } = await supabase
            .from("product_variations")
            .select("image_url")
            .eq("id", item.variation_id)
            .maybeSingle();
          variationImage = variation?.image_url;
        }

        const imageUrl = variationImage || product?.image_url;
        let imageBase64 = null;

        // Charger l'image et la convertir en base64
        if (imageUrl) {
          try {
            const fullImageUrl = imageUrl.startsWith('http')
              ? imageUrl
              : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${imageUrl}`;

            const imgResponse = await fetch(fullImageUrl);
            if (imgResponse.ok) {
              const arrayBuffer = await imgResponse.arrayBuffer();
              imageBase64 = Buffer.from(arrayBuffer).toString('base64');
            }
          } catch (e) {
            console.log(`Erreur chargement image pour ${item.product_name}:`, e);
          }
        }

        return {
          ...item,
          sku: product?.sku,
          product_image: imageUrl,
          product_image_base64: imageBase64,
        };
      })
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, phone")
      .eq("id", order.user_id)
      .maybeSingle();

    const { data: shippingMethod } = await supabase
      .from("shipping_methods")
      .select("name")
      .eq("id", order.shipping_method_id)
      .maybeSingle();

    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("name")
      .eq("id", order.payment_method_id)
      .maybeSingle();

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    let imgHeight = 30;
    const fullWidthImgWidth = pageWidth;

    // Charger le logo depuis le système de fichiers local
    let logoLoaded = false;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'lbdm-logobdc.png');
      console.log('📄 PDF - Tentative de chargement du logo depuis:', logoPath);

      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const base64Logo = logoBuffer.toString('base64');
        const imageDataUrl = `data:image/png;base64,${base64Logo}`;

        console.log('✅ PDF - Logo chargé avec succès, taille:', logoBuffer.length, 'octets');

        // Calculer les dimensions du logo
        const logoWidth = pageWidth;
        const logoHeight = 30;

        doc.addImage(imageDataUrl, 'PNG', 0, 0, logoWidth, logoHeight, undefined, 'FAST');
        imgHeight = logoHeight;
        logoLoaded = true;
        console.log('✅ PDF - Logo ajouté au document');
      } else {
        console.warn('⚠️ PDF - Logo non trouvé à:', logoPath);
      }
    } catch (e: any) {
      console.error('❌ PDF - Erreur chargement logo:', e.message);
    }

    // Si le logo n'a pas été chargé, ajouter un header noir simple
    if (!logoLoaded) {
      console.warn('⚠️ PDF - Génération sans logo (utilisation d\'un header de secours)');
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      doc.setFont("helvetica", "bold");
      doc.text("LA BOUTIQUE DE MORGANE", pageWidth / 2, 15, { align: "center" });
      imgHeight = 25;
    }

    let yPosition = imgHeight + 15;

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(212, 175, 55);
    doc.text("BON DE COMMANDE", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Commande N° ${order.order_number}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 5;
    doc.text(
      `Date: ${new Date(order.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    const leftCol = margin;
    const rightCol = pageWidth / 2 + 5;

    doc.text("Informations Vendeur", leftCol, yPosition);
    doc.text("Adresse de Livraison", rightCol, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const sellerInfo = [
      "MORGANE DEWANIN",
      "SAS (Société par Actions Simplifiée)",
      "1062 rue d'Armentières",
      "59850 Nieppe, France",
      "",
      "Tél : +33 6 41 45 66 71",
      "Email : contact@laboutiquedemorgane.com",
      "",
      "SIREN : 907 889 802",
      "SIRET : 907 889 802 00027",
      "TVA : FR16907889802",
      "APE : 4641Z"
    ];

    const clientInfo = [
      `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`,
      order.shipping_street || order.shipping_address?.address_line1 || '',
      order.shipping_address?.address_line2 || '',
      `${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}`,
      order.shipping_address?.country || 'France',
      '',
      `Tél: ${order.shipping_phone || order.shipping_address?.phone || profile?.phone || ''}`,
      profile?.email || ''
    ];

    let tempY = yPosition;
    sellerInfo.forEach((line) => {
      doc.text(line, leftCol, tempY);
      tempY += 4;
    });

    tempY = yPosition;
    clientInfo.forEach((line) => {
      if (line) {
        doc.text(line, rightCol, tempY);
        tempY += 4;
      }
    });

    yPosition = Math.max(yPosition + (sellerInfo.length * 4), tempY) + 10;

    const tableData = enrichedItems.map((item: any) => {
      let productName = item.product_name || 'Produit';

      // Ajouter le SKU/UGS si disponible
      if (item.sku) {
        productName += `\nUGS/SKU: ${item.sku}`;
      }

      // Parser et afficher les attributs
      const attributes = formatAttributes(item.variation_data);
      if (attributes) {
        productName += `\n(${attributes})`;
      }

      const price = Number(item.price) || 0;
      const quantity = item.quantity || 1;

      return [
        '', // Colonne vide pour l'image (sera remplie par didDrawCell)
        productName,
        `${quantity}`,
        `${price.toFixed(2)} €`,
        `${(quantity * price).toFixed(2)} €`,
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [["Image", "Produit", "Qté", "Prix Unit.", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [212, 175, 55],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center", valign: "middle" }, // Colonne Image
        1: { cellWidth: "auto" }, // Produit
        2: { cellWidth: 20, halign: "center" }, // Qté
        3: { cellWidth: 30, halign: "right" }, // Prix Unit.
        4: { cellWidth: 30, halign: "right" }, // Total
      },
      margin: { left: margin, right: margin },
      didDrawCell: (data: any) => {
        // Dessiner les images dans la première colonne (index 0)
        if (data.section === 'body' && data.column.index === 0) {
          const rowIndex = data.row.index;
          const item = enrichedItems[rowIndex];

          if (item && item.product_image_base64) {
            try {
              const cellX = data.cell.x;
              const cellY = data.cell.y;
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;

              // Taille de l'image (carrée, centrée)
              const imgSize = Math.min(cellWidth - 2, cellHeight - 2, 15); // Max 15mm
              const imgX = cellX + (cellWidth - imgSize) / 2;
              const imgY = cellY + (cellHeight - imgSize) / 2;

              // Détecter le type d'image
              let imageType = 'JPEG';
              const base64Header = item.product_image_base64.substring(0, 20);
              if (base64Header.includes('iVBOR')) imageType = 'PNG';
              if (base64Header.includes('UklGR')) imageType = 'WEBP';

              const imageDataUrl = `data:image/jpeg;base64,${item.product_image_base64}`;

              doc.addImage(imageDataUrl, imageType, imgX, imgY, imgSize, imgSize, undefined, 'FAST');
            } catch (e) {
              console.log(`Erreur ajout image dans cellule pour ${item.product_name}:`, e);
            }
          }
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    const rightAlign = pageWidth - margin;
    const labelX = rightAlign - 60;
    const valueX = rightAlign;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const subtotal = Number(order.subtotal) || 0;
    const shippingCost = Number(order.shipping_cost) || 0;
    const discountAmount = Number(order.discount_amount) || 0;
    const walletUsed = Number(order.wallet_amount_used) || 0;

    const totals = [
      ["Sous-total :", `${subtotal.toFixed(2)} €`],
      ["Frais de port :", `${shippingCost.toFixed(2)} €`],
    ];

    if (discountAmount > 0) {
      totals.push(["Remise :", `- ${discountAmount.toFixed(2)} €`]);
    }

    if (walletUsed > 0) {
      totals.push(["Cagnotte utilisée :", `- ${walletUsed.toFixed(2)} €`]);
    }

    if (order.coupon_code) {
      totals.push(["Code coupon :", order.coupon_code]);
    }

    if (order.referral_code) {
      totals.push(["Code de parrainage :", order.referral_code]);
    }

    totals.forEach(([label, value]) => {
      doc.text(label, labelX, yPosition, { align: "right" });
      doc.text(value, valueX, yPosition, { align: "right" });
      yPosition += 5;
    });

    yPosition += 2;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(labelX - 5, yPosition, valueX, yPosition);
    yPosition += 5;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL TTC :", labelX, yPosition, { align: "right" });
    const totalAmount = Number(order.total_amount || order.total) || 0;
    doc.text(`${totalAmount.toFixed(2)} €`, valueX, yPosition, { align: "right" });

    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    if (shippingMethod) {
      doc.text(`Mode de livraison : ${shippingMethod.name}`, margin, yPosition);
      yPosition += 5;
    }

    if (paymentMethod) {
      doc.text(`Mode de paiement : ${paymentMethod.name}`, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const legalText = [
      "Conformément à la loi n°78-17 du 6 janvier 1978, vous disposez d'un droit d'accès, de modification, de rectification et de suppression des données vous concernant.",
      "En cas de litige, seuls les tribunaux français seront compétents. Garantie légale de conformité et des vices cachés applicable.",
    ];

    legalText.forEach((line) => {
      const splitText = doc.splitTextToSize(line, pageWidth - (margin * 2));
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 3.5;
    });

    yPosition += 5;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "MORGANE DEWANIN - SAS au capital variable - SIREN 907 889 802 - TVA FR16907889802",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    const pdfBuffer = doc.output("arraybuffer");
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `Commande_${order.order_number}.pdf`,
    });
  } catch (error: any) {
    console.error("Erreur génération PDF:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF", details: error.message },
      { status: 500 }
    );
  }
}
